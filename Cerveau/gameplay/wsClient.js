var log = require("./log");
var Class = require(__basedir + "/utilities/class");
var Client = require("./client");
var net = require("net");
var ws = require("lark-websocket");

/*
 * @class
 * @classdesc A client to the game server via a WS connection
 * @extends Client
 */
var WSClient = Class(Client, {
    init: function(socket /* , ... */) {
        if(socket instanceof net.Socket) { // then we need to create a websocket interface wrapped around this net.Socket
            socket = ws.createClient(socket);
        }

        Client.init.apply(this, arguments);
    },

    _onDataEventName: "message",

    /**
     * Invoked when the websocket gets data
     *
     * @override
     * @param {Object} data - unparsed data from socket
     */
    _onSocketData: function(data) {
        Client._onSocketData.apply(this, arguments);

        var parsed = this._parseData(data);
        if(!parsed) {
            return; // because we got some invalid data, so we're going to fatally disconnect anyways
        }

        this.server.clientSentData(this, parsed);
    },

    /**
     * Sends a raw string through the socket
     *
     * @override
     * @param {string} str - string to send
     */
    _sendRaw: function(str) {
        Client._sendRaw.apply(this, arguments);

        this.socket.send(str);
    },

    /**
     * Invoked when the other end of this socket disconnects
     *
     * @override
     */
    disconnected: function() {
        Client.disconnected.apply(this, arguments);

        this.socket.destroy();
        delete this.socket;
    },

    /**
     * Gets the net module member of this socket for passing between threads
     *
     * @override
     */
    getNetSocket: function() {
        return this.socket._socket; // hackish, as we are grabbing a private socket out of the lark-websockets client, but works.
    },

     /**
      * Stops listening to the current socket, for passing to another thread
      *
      * @override
      */
    stopListeningToSocket: function() {
        Client.stopListeningToSocket.apply(this, arguments);

        this.socket.pause();
    },
});

module.exports = WSClient;
