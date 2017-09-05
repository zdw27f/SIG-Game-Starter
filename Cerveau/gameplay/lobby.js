const utilities = require(__basedir + "/utilities/");
const constants = require("./constants");
const errors = require("./errors");
const Class = utilities.Class;
const GameLogger = require("./gameLogger");
const Server = require("./server");
const Session = require("./session");
const Authenticator = require("./authenticator");
const Updater = require("./updater");
const log = require("./log");

const extend = require("extend");
const ws = require("lark-websocket");
const fs = require("fs");
const url = require("url");
const net = require("net");
const cluster = require("cluster");
const readline = require("readline");

/**
 * @class Lobby: The server clients initially connect to before being moved to their game session. Basically creates and manages game sessions.
 */
const Lobby = Class(Server, {
    init: function(args) {
        Server.init.call(this, args);

        this.name = "Lobby @ " + process.pid;
        this.tcpPort = args.tcpPort;
        this.wsPort = args.wsPort;
        this._authenticate = Boolean(args.authenticate); // flag to see if the lobby should authenticate play requests with web server
        this._allowGameSettings = Boolean(args.gameSettings);
        this._profile = Boolean(args.profile);
        this._sessions = {};
        this._gameClasses = {};

        this._authenticator = new Authenticator(this._authenticate);
        this._runningSessions = {}; // indexed by (gameName + id)
        this._nextGameNumber = 1;
        this._isShuttingDown = false;

        this._initializeGames();

        this.gameLogger = new GameLogger(args);

        cluster.setupMaster({
            exec: __basedir + "/gameplay/worker.js",
        });

        var self = this; // for async reference in passed listener functions below
        cluster.on("exit", function(worker) {
            self._sessionOver(worker.session);
        });

        this._listenerServer = {};
        this._initializeListener("TCP", net, this.tcpPort);
        this._initializeListener("WS", ws, this.wsPort);

        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        // ReadLine: listens for CTRL+C to kill off child threads gracefully (letting their games complete)
        rl.setPrompt("");
        rl.on("SIGINT", function() {
            if(!self._isShuttingDown) {
                self._isShuttingDown = true;
                log("Shutting down gracefully...");

                var numCurrentGames = Object.keys(self._runningSessions).length;
                log("{0} game{1} currently running{2}.".format(numCurrentGames, numCurrentGames === 1 ? "" : "s", numCurrentGames === 0 ? ", so we can shut down immediately" : ""));

                var clients = self.clients.clone();
                for(var i = 0; i < clients.length; i++) {
                    var client = clients[i];
                    client.disconnect("Sorry, the server is shutting down.");
                }

                if(numCurrentGames > 0) {
                    log("Waiting for them to exit before shutting down.");
                    log("^C again to force shutdown, which force disconnects clients.");
                }
                else {
                    process.exit(0);
                }
            }
            else {
                log("Force shutting down.");
                process.exit(1);
            }
        });

        if(args.updater) {
            this.updater = new Updater({
                autoupdate: args.autoupdate,
            });
        }
    },

    /**
     * Creates and initializes a server that uses a listener pattern identical to net.Server
     *
     * @param {string} key - type of server and what type of clients to expect from it
     * @param {Object} module - the required module that has a createServer method
     * @param {number} port - port to listen on for this server
     */
    _initializeListener: function(key, module, port) {
        var self = this;

        var listener = module.createServer(function(socket) {
            self.addSocket(socket, key);
        });

        listener.listen(port, "0.0.0.0", function() {
            log("--- Lobby listening on port {0} for {1} Clients ---".format(port, key));
        });

        listener.on("error", function(err) {
            self._socketError(err, port);
        });

        this._listenerServer[key] = listener;
    },

    /**
     * Initializes all the games in the games/ folder
     */
    _initializeGames: function() {
        var dirs = utilities.getDirs("./games");

        for(var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];

            log("» '" + dir.upcaseFirst() + "' game found.");

            var path = __basedir + "/games/" + dir;
            var gameClass = require(path + "/");
            var gameName = gameClass.prototype.name;

            // hook up all the ways to get index the game class by
            var aliases = gameClass.aliases.concat(gameName);
            for(var a = 0; a < aliases.length; a++) {
                this._gameClasses[aliases[a].toLowerCase()] = gameClass;
            }

            this._sessions[gameName] = {};

        }
    },

    /**
     * listener for when a listener socket (that accepts incoming clients) errors out. This will probably only happen if it tries to listen on port already in use.
     *
     * @param {Error} err - the error the TCP socket threw
     * @param {number} port - port errored on
     */
    _socketError: function(err, port) {
        log.error(err.code !== "EADDRINUSE" ? err : "Lobby cannot listen on port " + port + " for game connections. Address in use.\nThere's probably another Cerveau server running on this same computer.");

        process.exit(1);
    },


    /**
     * Gets the session for gameAlias and session id, if it exists
     *
     * @param {string} gameAlias - The name alias of the game for this session
     * @param {string} id - the session id of the gameName
     * @returns {Session} the session, if found
     */
    getSession: function(gameAlias, id) {
        if(typeof(gameAlias) === "string" && typeof(id) === "string") {
            return this._sessions[this.getGameNameForAlias(gameAlias)][id]; // this if gameAlias is not valid this will throw and exception
        }
    },

    /**
     * Retrieves, or creates a new, session. For clients when saying what they want to play
     *
     * @param {string} gameName - key identifying the name of the game you want. Should exist in games/
     * @param {string} [id] - basically a room id. Specifying an id can be used to join other players on purpose. "*" will join you to any open session or a new one, and "new" will always give you a brand new room even if there are open ones.
     * @returns {Session} the game of gameName and id. If one does not exists a new instance will be created
     */
    _getOrCreateSession: function(gameName, id) {
        var session; // the session we are trying to get

        if(id !== "new") {
            if(id === "*" || id === undefined) { // then they want to join any open game
                // try to find an open session
                for(var sessionID in this._sessions[gameName]) {
                    if(this._sessions[gameName].hasOwnProperty(sessionID)) {
                        var otherSession = this._sessions[gameName][sessionID];
                        if(otherSession.isOpen()) {
                            session = otherSession;
                            break;
                        }
                    }
                }

                if(!session) { // then there was no open game session to join, so they get a new session
                    id = "new";
                }
            }
            else {
                session = this.getSession(gameName, id);
            }
        }

        if(session) {
            if(session.isRunning()) {
                id = "new";
                session = undefined;
            }
            else if(session.isOver()) {
                delete this._sessions[gameName][id]; // we will create a new session below to replace this one
                session = undefined;
            }
        }

        if(!session) { // then we couldn't find a session from the requested gameName + id, so they get a new one
            if(id === "new" || id === undefined) {
                id = String(this._nextGameNumber++);
            }

            session = new Session(id, this.getGameClass(gameName), this);

            this._sessions[gameName][id] = session;
        }

        return session;
    },

    /**
     * Gets the actual name of an alias for a game, e.g. "checkers" -> "Checkers"
     *
     * @param {string} gameAlias - an alias for the game, not case senstive
     * @returns {string|undefined} the actual game name of the aliased game, or undefined if not valid
     */
    getGameNameForAlias: function(gameAlias) {
        return this.getGameClass(gameAlias).prototype.name;
    },

    /**
     * Gets the game class (constructor) for a given game alias
     *
     * @param {strnig} gameAlias - an alias for the game you want
     * @returns {Class} the game class constructor, if found
     */
    getGameClass: function(gameAlias) {
        if(gameAlias) {
            var gameClass = this._gameClasses[gameAlias.toLowerCase()]; // don't use gameGameCLass() as that calls this function
            if(gameClass) {
                return gameClass;
            }
        }

        throw new Error("String '{}' is no alias for any known games".format(gameAlias));
    },

    /**
     * When a client sends the 'play' event, which tells the server what it wants to play and as who.
     *
     * @param {Client} client - the client that send the 'play'
     * @param {Object} data - information about what this client wants to play. should include 'playerName', 'clientType', 'gameName', and 'gameSession'
     */
    _clientSentPlay: function(client, data) {
        var fatalMessage = this._validatePlayData(data);
        if(fatalMessage) {
            client.send("fatal", new errors.CerveauError(fatalMessage));
            client.disconnect(); // no need to keep them connected, they want to play something we don't have
            return;
        }

        var self = this;
        this._authenticator.authenticate({
            gameName: data.gameName,
            username: data.playerName,
            password: data.password,
            success: function() {
                var session = self._getOrCreateSession(data.gameName, data.requestedSession);
                var playerIndex = parseInt(data.playerIndex);

                if(playerIndex && playerIndex < 0 || playerIndex >= session.numberOfPlayers) { // then the index is out of the range
                    playerIndex = undefined;
                }

                if(playerIndex) { // then we need to check to make sure they did not request an already requested player index
                    for(var i = 0; i < session.clients.length; i++) {
                        var existingClient = session.clients[i];
                        if(existingClient.playerIndex === playerIndex) {
                            playerIndex = undefined;
                            break;
                        }
                    }
                }

                client.setInfo({
                    name: data.playerName,
                    playerIndex: isNaN(playerIndex) ? undefined : playerIndex,
                    type: data.clientType,
                    spectating: Boolean(data.spectating),
                    metaDeltas: Boolean(data.metaDeltas),
                });

                session.addClient(client);

                if(data.gameSettings) {
                    session.addGameSettings(data.gameSettings);
                }

                client.send("lobbied", {
                    gameName: data.gameName,
                    gameSession: session.id,
                    constants: constants.shared,
                });

                if(session.canStart()) {
                    session.start();
                    self._runningSessions[session.gameName + session.id] = session;
                }
            },
            failure: function() {
                client.send("fatal", {
                    message: "Unauthorized to play in this lobby with given name/password.",
                    unauthorized: true,
                });
                client.disconnect();
            },
        });
    },

    /**
     * When a client sends the 'alias' event, which tells use they want to know what this game alias really is
     *
     * @param {Client} client - the client that send the 'play'
     * @param {string} alias - the alias they want named
     */
    _clientSentAlias: function(client, alias) {
        var gameName;
        try {
            gameName = this.getGameNameForAlias(alias);
        }
        catch(err) {
            client.disconnect("'{}' is no known alias for any game.".format(alias));
            return;
        }

        client.send("named", gameName);
    },

    /**
     * Validates that the data sent in a 'play' event from a client is valid
     *
     * @param {Object} data - the play event data to validate
     * @returns {string} human readable text why the data is not valid
     */
    _validatePlayData: function(data) {
        if(!data) {
            return "Sent 'play' event with no data.";
        }

        if(this._isShuttingDown) {
            return "Game server is shutting down and not accepting new clients.";
        }

        var gameAlias = String(data && data.gameName); // clients can send aliases of what they want to play
        try {
            data.gameName = this.getGameNameForAlias(gameAlias);
        }
        catch(err) {
            return "Game of name '" + gameAlias + "' not found on this server.";
        }

        if(data && data.gameSettings && this._allowGameSettings) {
            try {
                data.gameSettings = url.parse("urlparms?" + data.gameSettings, true).query;
            }
            catch(err) {
                return "Game settings incorrectly formatted. Must be one string in the url parms format.";
            }
        }
    },

    /**
     * Invoked when a client disconnects from the lobby
     *
     * @override
     * @param {Client} client - the client that disconnected
     */
    clientDisconnected: function(client /* ... */) {
        if(client.session) {
            var session = client.session;

            session.removeClient(client);

            if(session.clients.length === 0) { // that session is empty, no need to keep it around
                delete this._sessions[session.gameName][session.id];
                delete client.session;

                if(parseInt(session.id) + 1 === this._nextGameNumber) { // then the next game number was never used, so reuse it
                    this._nextGameNumber--;
                }
            }
        }

        return Server.clientDisconnected.apply(this, arguments);
    },

    /**
     * Called when a session is over. This should only occur when a game ends
     *
     * @param {Session} session - the session that ended.
     */
    _sessionOver: function(session) {
        delete this._runningSessions[session.gameName + session.id];

        if(this._isShuttingDown && Object.keys(this._runningSessions).length === 0) {
            log("Final game session exited. Shutdown complete.");
            process.exit(0);
        }
    },
});

module.exports = Lobby;
