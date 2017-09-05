var app = require("./app");
var getGameInfos = require("./getGameInfos");
var formatGamelogs = require("./formatGamelogs");

module.exports = function(args) {
    app.locals.site = {
        title: args.title,
    };

    if(args.web) {
        var lobby = args.lobby;
        formatGamelogs.init(lobby, args);

        app.get("/", function(req, res) {
            var gameInfos = getGameInfos();

            var games = [];
            for(var gameName in gameInfos) {
                if(gameInfos.hasOwnProperty(gameName)) {
                    var gameInfo = gameInfos[gameName];
                    games.push({
                        name: gameName,
                        description: gameInfo.Game.description,
                    });
                }
            }

            games.sort(function(a, b) {
                return a.name.toLowerCase() > b.name.toLowerCase();
            });

            var maxGamelogsOnIndex = 10;
            lobby.gameLogger.getLogs(function(logs) {
                var error = !logs;
                logs = logs || [];

                var gamelogs = [];
                var i = logs.length;

                while(i-- && gamelogs.length < maxGamelogsOnIndex) {
                    gamelogs.push(logs[i]);
                }

                res.render("index", {
                    games: games,
                    gamelogs: formatGamelogs(gamelogs),
                    moreGamelogs: (gamelogs.length === maxGamelogsOnIndex && logs.length > gamelogs.length),
                });
            });
        });

        // TODO: maybe move to /routes and have that auto require files like this?
        require("./documentation")(args);
        require("./achieves")(args);
    }

    if(args.api) {
        require("./api")(args);
    }
};
