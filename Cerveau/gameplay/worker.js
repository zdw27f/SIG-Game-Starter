// This is the script that can be thought of as the 'main.js' for each worker thread that spins up a game session into an Instance using true multithreading
var cluster = require("cluster");
if(cluster.isMaster) {
    /* eslint-disable no-console */
    console.error("ERROR: worker running on master thread");
    /* eslint-enable no-console */
    process.exit(1); // worker threads not intended to run on main thread.
}

var data = JSON.parse(process.env.workerGameSessionData);

var portOffset = parseInt(data.gameSession) || process.pid;
process._debugPort = (data._mainDebugPort || 5858) + portOffset; // for debugging the port is node-inspector default (5858) plus the game session if it's a number, or a pid
process.title = data.gameName + " - " + data.gameSession;

if(!data.gameSettings.randomSeed) {
    data.gameSettings.randomSeed = data.gameSettings.randomSeed || Math.random().toString(36).substring(2); // this will generate a random number e.g. 0.07568844663910568, and then converts those numbers after 0. to characters. Thus defaulting the random seed to a chars between a-z, A-Z, and 0-9.
}

require("seedrandom"); // allows seeding of Math.random()
Math.seedrandom(data.gameSettings.randomSeed || undefined); // use the 'seedrandom' module to seed Math.random() with the requested game setting for it (randomSeed). Either way store it so it can be logged in the gamelog.

data.gameSettings.session = data.gameSession;

global.__basedir = data.__basedir;

require("cadre-js-extensions"); // because we are a new thread, and have not extended our base prototypes

var Instance = require("./instance");
var log = require("./log");
var extend = require("extend");

var instance = new Instance(extend({
    gameClass: require(__basedir + "/games/" + data.gameName.lowercaseFirst() + "/"),
    profiler: data.profile && require("v8-profiler"),
}, data));

var socketIndex = 0;
process.on("message", function(message, handler) {
    if(message === "socket") { // Note: Node js can only send sockets via handler if message === "socket", because passing sockets between threads is sketchy as fuck
        var socket = handler;
        var info = data.clientInfos[socketIndex];

        instance.addSocket(socket, info.connectionType, info);

        socketIndex++;
    }
});

process.once("uncaughtException", function(err) {
    instance.fatal(err);
});
