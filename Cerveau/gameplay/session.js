var utilities = require(__basedir + "/utilities/");
var constants = require("./constants");
var Server = require("./server");
var errors = require("./errors");
var Class = utilities.Class;
var log = require("./log");

var extend = require("extend");
var cluster = require("cluster");

/**
 * @class Session: A container for the Lobby to contain clients and information about what they want to play
 */
var Session = Class({
    init: function(id, gameClass, lobby) {
        this.id = id;
        this.gameClass = gameClass;
        this.gameName = gameClass.prototype.name;
        this.lobby = lobby;

        this.numberOfPlayers = gameClass.numberOfPlayers;
        this.clients = [];
        this.gameSettings = {};
        this.over = false;
    },

    /**
     * @see Server.getClientsPlaying
     */
    getClientsPlaying: Server.getClientsPlaying,

    /**
     * Adds a client to this session
     *
     * @param {Client} client - the client to add to this session
     */
    addClient: function(client) {
        this.clients.push(client);
        client.session = this;
    },

    /**
     * Removes a client from this session
     *
     * @param {Client} client - the client to remove from this session
     */
    removeClient: function(client) {
        this.clients.removeElement(client);
        delete client.session;
    },

    /**
     * If this session is open to more clients joining
     *
     * @returns {boolean} true if open, false otherwise
     */
    isOpen: function() {
        return !this.isOver() && !this.isRunning() && !this.canStart();
    },

    /**
     * If this session has enough playing clients in it to start running. Lobby starts sessions.
     *
     * @returns {boolean} true if ready to start running, false otherwise
     */
    canStart: function() {
        return Boolean(!this.isOver() && !this.isRunning() && this.getClientsPlaying().length === this.numberOfPlayers);
    },

    /**
     * Starts this session by having it spin up a new worker thread for the game instance
     */
    start: function() {
        if(this.lobby.updater && this.lobby.updater.foundUpdates()) {
            log.warning("Starting a game session without updates!");
        }
        this._threadInstance();
    },

    /**
     * If this session has a game instance running on a worker thread.
     *
     * @returns {boolean} true if it is running, false otherwise
     */
    isRunning: function() {
        return Boolean(this._worker);
    },

    /**
     * If this session has already ran it's game instance and is over. This means clients have won/lost and disconnected. Sessions that are over are also expected to be deleted at some point.
     *
     * @returns {boolean} true if over, false otherwise
     */
    isOver: function() {
        return this.over;
    },

    /**
     * Adds game settings to this game instance, parsing them from strings to correct types
     *
     * @param {Object} settings - the key/value pair settings to add
     */
    addGameSettings: function(settings) {
        for(var key in settings) {
            if(Object.prototype.hasOwnProperty.call(settings, key) && !this.gameSettings.hasOwnProperty(key)) { // this way if another player wants to set a game setting an earlier player set, the first requested setting is used.
                this.gameSettings[key] = utilities.unstringify(settings[key]);
            }
        }
    },

    /**
     * This happens when there are enough clients to start the game Instance. We start the on a separate "worker" thread, true multi-threading via cluster
     */
    _threadInstance: function() {
        var clientInfos = this._generateClientInfos();

        var workerGameSessionData = extend({ // can only pass strings via environment variables so serialize them here and the worker threads will deserialize them once running
            __basedir: __basedir,
            _mainDebugPort: process._debugPort,
            gameSession: this.id,
            gameName: this.gameName,
            clientInfos: clientInfos,
            profile: this.lobby._profile,
        }, this.lobby._initArgs);

        workerGameSessionData.gameSettings = this.gameSettings;

        this._worker = cluster.fork({
            workerGameSessionData: JSON.stringify(workerGameSessionData),
        });

        var self = this;
        this._worker.on("online", function() {
            for(var i = 0; i < self.clients.length; i++) {
                var client = self.clients[i];
                client.stopListeningToSocket(); // we are about to send it, so we don't want this client object listening to it, as we no longer care.
                self._worker.send("socket", client.getNetSocket());

                self.lobby.clients.removeElement(client);
            }

            self.clients = clientInfos;
        });

        this._worker.on("message", function(data) { // this message should only happen once, when the game is over
            if(data.gamelog) {
                delete self._worker; // we are done with that worker thread
                self.over = true;
                self.winners = data.gamelog.winners;
                self.losers = data.gamelog.losers;
                self.gamelogFilename = null; // null to signify the gamelog does not exist, as it has not be written to the file system yet

                // write the gamelog, once written update our `gamelogFilename` to the actual slug to signify it can be read now
                self.lobby.gameLogger.log(data.gamelog, function(filename) {
                    self.gamelogFilename = filename;
                });
            }
        });

        this._worker.session = this;
    },

    /**
     * Generates the info of the clients in playerIndex order for thread safe passing, also re-sorts this.clients
     *
     * @returns {Array.<Object>} an array of client like objects that can be passed to a thread via json, then turned back to a client on that thread
     */
    _generateClientInfos: function() {
        // each client sent their info with the 'play' event already, we need to send that to the new thread
        var clients = [];
        var client;
        var unplacedPlayers = [];
        var numberOfPlayers = 0;
        var specators = [];

        // place players where they want to be based on playerIndex
        for(var i = 0; i < this.clients.length; i++) {
            client = this.clients[i];

            if(client.spectating) {
                specators.push(client);
            }
            else {
                numberOfPlayers++;

                if(client.playerIndex !== undefined && !clients[client.playerIndex]) {
                    clients[client.playerIndex] = client;
                }
                else {
                    unplacedPlayers.push(client);
                }
            }
        }

        // place clients after all the players, so the clients array will look like: [player1, player2, ..., playerN, spectator1, spectator2, ..., specatorN]
        for(i = numberOfPlayers; i < this.clients.length; i++) {
            clients[i] = specators[i - numberOfPlayers];
        }

        // finally, find a spot for the unplaced players
        var nextPlayerIndex = 0;
        for(i = 0; i < unplacedPlayers.length; i++) {
            while(clients[nextPlayerIndex]) {
                nextPlayerIndex++;
            }

            clients[nextPlayerIndex] = unplacedPlayers[i];
        }

        // update the playerIndexes for all the clients here on the lobby
        for(i = 0; i < clients.length; i++) {
            client = clients[i];
            if(!client.spectating) {
                client.playerIndex = i;
            }
        }

        var clientInfos = [];
        for(i = 0; i < clients.length; i++) {
            client = clients[i];
            this.clients[i] = client;

            clientInfos.push({
                index: i,
                name: client.name,
                type: client.type,
                connectionType: client.connectionType,
                spectating: client.spectating,
                metaDeltas: client.metaDeltas || false,
            });
        }

        return clientInfos;
    },
});

module.exports = Session;
