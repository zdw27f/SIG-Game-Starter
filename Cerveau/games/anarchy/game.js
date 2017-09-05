// Game: Two player grid based game where each player tries to burn down the other player's buildings. Let it burn.

const Class = require("classe");
const log = require(`${__basedir}/gameplay/log`);
const TwoPlayerGame = require(`${__basedir}/gameplay/shared/twoPlayerGame`);
const TurnBasedGame = require(`${__basedir}/gameplay/shared/turnBasedGame`);

//<<-- Creer-Merge: requires -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

// any additional requires you want can be required here safely between Creer re-runs

//<<-- /Creer-Merge: requires -->>

// @class Game: Two player grid based game where each player tries to burn down the other player's buildings. Let it burn.
let Game = Class(TwoPlayerGame, TurnBasedGame, {
    /**
     * Initializes Games.
     *
     * @param {Object} data - a simple mapping passed in to the constructor with whatever you sent with it. GameSettings are in here by key/value as well.
     */
    init: function(data) {
        TurnBasedGame.init.apply(this, arguments);
        TwoPlayerGame.init.apply(this, arguments);

        /**
         * How many bribes players get at the beginning of their turn, not counting their burned down Buildings.
         *
         * @type {number}
         */
        this.baseBribesPerTurn = this.baseBribesPerTurn || 0;

        /**
         * All the buildings in the game.
         *
         * @type {Array.<Building>}
         */
        this.buildings = this.buildings || [];

        /**
         * The current Forecast, which will be applied at the end of the turn.
         *
         * @type {Forecast}
         */
        this.currentForecast = this.currentForecast || null;

        /**
         * The player whose turn it is currently. That player can send commands. Other players cannot.
         *
         * @type {Player}
         */
        this.currentPlayer = this.currentPlayer || null;

        /**
         * The current turn number, starting at 0 for the first player's turn.
         *
         * @type {number}
         */
        this.currentTurn = this.currentTurn || 0;

        /**
         * All the forecasts in the game, indexed by turn number.
         *
         * @type {Array.<Forecast>}
         */
        this.forecasts = this.forecasts || [];

        /**
         * A mapping of every game object's ID to the actual game object. Primarily used by the server and client to easily refer to the game objects via ID.
         *
         * @type {Object.<string, GameObject>}
         */
        this.gameObjects = this.gameObjects || {};

        /**
         * The width of the entire map along the vertical (y) axis.
         *
         * @type {number}
         */
        this.mapHeight = this.mapHeight || 0;

        /**
         * The width of the entire map along the horizontal (x) axis.
         *
         * @type {number}
         */
        this.mapWidth = this.mapWidth || 0;

        /**
         * The maximum amount of fire value for any Building.
         *
         * @type {number}
         */
        this.maxFire = this.maxFire || 0;

        /**
         * The maximum amount of intensity value for any Forecast.
         *
         * @type {number}
         */
        this.maxForecastIntensity = this.maxForecastIntensity || 0;

        /**
         * The maximum number of turns before the game will automatically end.
         *
         * @type {number}
         */
        this.maxTurns = this.maxTurns || 0;

        /**
         * The next Forecast, which will be applied at the end of your opponent's turn. This is also the Forecast WeatherStations can control this turn.
         *
         * @type {Forecast}
         */
        this.nextForecast = this.nextForecast || null;

        /**
         * List of all the players in the game.
         *
         * @type {Array.<Player>}
         */
        this.players = this.players || [];

        /**
         * A unique identifier for the game instance that is being played.
         *
         * @type {string}
         */
        this.session = this.session || "";


        //<<-- Creer-Merge: init -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        // properties
        this.maxTurns = 300;
        this.mapWidth = 40;
        this.mapHeight = 20;
        this.maxFire = 20;
        this.baseBribesPerTurn = 10;

        // server only variables
        this.directions = [ "north", "east", "south", "west" ]; // TODO: expose to AIs?
        this.directionalOffset = {
            north: {x: 0, y: -1},
            east: {x: 1, y: 0},
            south: {x: 0, y: 1},
            west: {x: -1, y: 0},
        };

        this.headquartersHealthScalar = 3;
        this.maxForecastIntensity = 10;
        this.firePerTurnReduction = 1;
        this.exposurePerTurnReduction = 10;

        //<<-- /Creer-Merge: init -->>
    },

    name: "Anarchy",

    aliases: [
        //<<-- Creer-Merge: aliases -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.
        "MegaMinerAI-16-Anarchy",
        //<<-- /Creer-Merge: aliases -->>
    ],



    /**
     * This is called when the game begins, once players are connected and ready to play, and game objects have been initialized. Anything in init() may not have the appropriate game objects created yet..
     */
    begin: function() {
        TurnBasedGame.begin.apply(this, arguments);
        TwoPlayerGame.begin.apply(this, arguments);

        //<<-- Creer-Merge: begin -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        this._buildingsGrid = [];
        var originalBuildings = [];

        // Some configuration parameters to change map generation
        var minNumberOfPoints = 8;
        var maxNumberOfPoints = 15;
        var minEdgePoints = 1;
        var maxEdgePoints = 5;
        var points = [];
        var numberOfPoints = Math.randomInt(maxNumberOfPoints, minNumberOfPoints);
        var edgePoints = Math.randomInt(maxEdgePoints, minEdgePoints);
        var used = {};
        var i, j, x, y;

        // add random points
        for(i = 0; i < numberOfPoints; i++) {
            x = Math.randomInt(this.mapWidth / 2 - 1, 0);
            y = Math.randomInt(this.mapHeight - 1, 0);
            if(!used[x + "," + y]) {
                used[x + "," + y] = true;
                points.push({x: x, y: y});
            }
        }
        // add edge points
        for(i = 0; i < edgePoints; i++) {
            x = this.mapWidth / 2 - 1;
            y = Math.randomInt(this.mapHeight - 1, 0);
            if(!used[x + "," + y]) {
                used[x + "," + y] = true;
                points.push({x: x, y: y});
            }
        }
        // now connect the points, after shuffling them
        points.shuffle();
        var startLength = points.length;
        for(i = 0; i < startLength; i++) {
            var fromX = points[i].x;
            var fromY = points[i].y;
            var to = points[i + 1];
            while(true) {
                var changes = [];
                // Is there a better way to do this?
                if(fromX < to.x) {
                    changes.push({x:  1, y: 0});
                }
                else if(fromX > to.x) {
                    changes.push({x: -1, y: 0});
                }
                if(fromY < to.y) {
                    changes.push({x: 0, y:  1});
                }
                else if(fromY > to.y) {
                    changes.push({x: 0, y: -1});
                }
                // this means that the point has already been reached
                // so break from the loop
                if(changes.length === 0) {
                    break;
                }
                // otherwise choose a random direction and add it to the
                // points
                var change = changes.randomElement();
                var newX = fromX + change.x;
                var newY = fromY + change.y;
                fromX = newX;
                fromY = newY;

                if(!used[newX + "," + newY]) {
                    points.push({x: newX, y:newY});
                    // mark as used
                    used[newX + "," + newY] = true;
                }
            }
        }

        // make the grid
        for(x = 0; x < this.mapWidth; x++) {
            this._buildingsGrid[x] = [];
        }

        var buildingTypes = ["Warehouse", "FireDepartment", "PoliceDepartment", "WeatherStation"];
        // keep track of numbers created to ensure minimum of at least 2 for each
        // weights for each building type
        var weights = [0.40, 0.30, 0.20, 0.10];
        var minimumBuildingsPerType = 2;
        var numCreated = [0, 0, 0, 0];

        for(i = 0; i < points.length; i++) {
            // use index so that numbers can be tracked
            var randomNumber = Math.random();
            var buildingIndex = 0;
            while(true) {
                randomNumber -= weights[buildingIndex];
                if(randomNumber <= 0) {
                    break;
                }
                ++buildingIndex;
              // just to be safe
                buildingIndex %= 4;
            }
            // how many buildings are left to be generated
            var left = points.length - i;
            // potential issues if this is true
            if(left <= buildingTypes.length * minimumBuildingsPerType) {
                // find if there are any buildings that should be forced to create
                for(j = 0; j < numCreated.length; j++) {
                    if(numCreated[j] < minimumBuildingsPerType) {
                        buildingIndex = j;
                        break;
                    }
                }
            }

            numCreated[buildingIndex]++;

            originalBuildings.push(this._createBuilding(buildingTypes[buildingIndex], {
                x: points[i].x,
                y: points[i].y,
                owner: this.players.randomElement(),
            }));
        }
        this.players[0].warehouses.randomElement().makeHeadquarters();

        // mirror the map
        for(i = 0; i < originalBuildings.length; i++) {
            var originalBuilding = originalBuildings[i];
            this._createBuilding(originalBuilding.gameObjectName, {
                x: this.mapWidth - originalBuilding.x - 1,
                y: originalBuilding.y,
                owner: this.getOtherPlayers(originalBuilding.owner)[0],
                isHeadquarters: originalBuilding.isHeadquarters,
            });
        }

        var direction;
        // now all the buildings on the map should be created, so hook up the north/east/south/west pointers
        for(i = 0; i < this.buildings.length; i++) {
            var building = this.buildings[i];
            for(direction in this.directionalOffset) {
                if(this.directionalOffset.hasOwnProperty(direction)) {
                    var offset = this.directionalOffset[direction];
                    building["building" + direction.upcaseFirst()] = this._getBuildingAt(building.x + offset.x, building.y + offset.y);
                }
            }
        }

        // create the forecasts, each "set" of turns (e.g. 0 and 1, 100 and 101, 264 and 265, etc) are the same initial states for each player.
        for(i = 0; i < this.maxTurns; i += 2) {
            direction = this.directions.randomElement();
            var intensity = Math.randomInt(0, this.maxForecastIntensity);

            for(j = 0; j < 2; j++) {
                if(j === 1) { // for the second player's forecasts mirrot the directions East/West
                    if(direction === "east") {
                        direction = "west";
                    }
                    else if(direction === "west") {
                        direction = "east";
                    }
                }

                this.forecasts.push(this.create("Forecast", {
                    direction: direction,
                    intensity: intensity,
                    controllingPlayer: this.players[j],
                }));
            }
        }

        this.currentForecast = this.forecasts[0];
        this.nextForecast = this.forecasts[1];

        // ensure players have bribes on the first turn
        for(i = 0; i < this.players.length; i++) {
            this.players[i].bribesRemaining = this.baseBribesPerTurn;
        }

        // Fix fireAdded not being set for both headquarters
        this.players[1].headquarters.fireAdded = this.players[0].headquarters.fireAdded;

        //<<-- /Creer-Merge: begin -->>
    },

    /**
     * This is called when the game has started, after all the begin()s. This is a good spot to send orders.
     */
    _started: function() {
        TurnBasedGame._started.apply(this, arguments);
        TwoPlayerGame._started.apply(this, arguments);

        //<<-- Creer-Merge: _started -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.
        // any logic for _started can be put here
        //<<-- /Creer-Merge: _started -->>
    },


    //<<-- Creer-Merge: added-functions -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

    /**
     * Invoked when the maximum number of turns is reached, a winner must be decided
     *
     * @override
     */
    _maxTurnsReached: function() {
        TurnBasedGame._maxTurnsReached.apply(this, arguments);
        var returned = TurnBasedGame._maxTurnsReached.apply(this, arguments);

        this._secondaryWinConditions("Max turns reached (" + this.maxTurns + ")");

        return returned;
    },

    /**
     * Invoked when the current player ends their turn, and we should do in between turn logic
     *
     * @override
     */
    nextTurn: function() {
        var playersBurnedDownBuildings = {};
        var fireSpreads = [];

        for(var i = 0; i < this.buildings.length; i++) {
            var building = this.buildings[i];

            if(building.fire > 0) {
                building.health = Math.max(0, building.health - building.fire); // it takes fire damage

                if(building.health <= 0) {
                    playersBurnedDownBuildings[building.owner.id] = (playersBurnedDownBuildings[building.owner.id] || 0) + 1;
                }
                // try to spread the fire
                if(this.currentForecast.intensity > 0) {
                    var buildingSpreadingTo = building["building" + this.currentForecast.direction.upcaseFirst()];
                    if(buildingSpreadingTo) {
                        fireSpreads.push({
                            building: buildingSpreadingTo,
                            fire: Math.min(building.fire, this.currentForecast.intensity),
                        });
                    }
                }

                building.fire = Math.max(0, building.fire - this.firePerTurnReduction); // it dies down after dealing damage
            }

            if(building.exposure > 0 && !building.bribed) { // then they didn't act, so their exposure drops
                building.exposure = Math.max(building.exposure - this.exposurePerTurnReduction, 0);
            }

            building.bribed = false;
        }

        // now that every building has been damaged, check for winner via burning down Headquarters
        var loser, player;
        for(i = 0; i < this.players.length; i++) {
            player = this.players[i];
            if(player.headquarters.health <= 0) { // then it burned down, and they have lost
                if(loser) { // someone else already lost this turn... so they both lost their headquarters this turn, so check secondary win conditions (and the game is over)
                    this._secondaryWinConditions("Both headquarters reached zero health on the same turn");
                    loser = undefined;
                    break;
                }
                loser = player;
            }
        }

        if(loser) {
            this.declareLoser(loser, "Headquarters reached zero health.");
            this.declareWinner(loser.otherPlayer, "Reduced health of enemy's headquarters to zero.");
        }

        // spread fire, now that everything has taken fire damage
        for(i = 0; i < fireSpreads.length; i++) {
            var fireSpread = fireSpreads[i];
            fireSpread.building.fire = Math.max(fireSpread.building.fire, fireSpread.fire);
        }

        this.currentForecast = this.nextForecast;
        // Turn isn't incremented until return statement
        this.nextForecast = this.forecasts[this.currentTurn + 2];

        for(i = 0; i < this.players.length; i++) {
            player = this.players[i];
            player.bribesRemaining = this.baseBribesPerTurn + (playersBurnedDownBuildings[player.id] || 0);
        }

        return TurnBasedGame.nextTurn.apply(this, arguments);
    },

    /**
     * creates a Building of the class type, and adds it to the necessary lists.
     *
     * @param {string} buildingType - the class name of the Building sub class
     * @param {object} data - initialization data for new building. Must have an owner set
     * @returns {Building} the newly created and hooked up building
     */
    _createBuilding: function(buildingType, data) {
        var newBuilding = this.create(buildingType, data);

        this._buildingsGrid[newBuilding.x][newBuilding.y] = newBuilding;
        this.buildings.push(newBuilding);
        newBuilding.owner.buildings.push(newBuilding);
        newBuilding.owner[buildingType.lowercaseFirst() + "s"].push(newBuilding); // adds the new building to it's owner list of that building type

        return newBuilding;
    },

    /**
     * tries to get the building at a given (x, y), or null if there is none. O(1) lookup time
     *
     * @param {number} x - x position
     * @param {number} y - y position
     * @returns {Building|null} the building at (x, y) if there is one, null otherwise
     */
    _getBuildingAt: function(x, y) {
        if(x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            return this._buildingsGrid[x][y] || null;
        }

        return null;
    },

    /**
     * Checks and declares winner/losers based on alternative win conditions
     *
     * @param {string} reasonWhy - the reason why we have to check for secondary win conditions
     */
    _secondaryWinConditions: function(reasonWhy) {
        var calculations = []; // all the numbers we will need to figure out the secondary win conditions winner
        var winConditions = [ // the alternative win conditions the are finding calculations for
            {
                key: "headquartersHealth",
                winReason: "Your headquarters had the most health remaining.",
                loseReason: "Your headquarters had less health remaining than another player.",
            },
            {
                key: "buildingsAlive",
                winReason: "You had the most buildings not burned down.",
                loseReason: "You had more buildings burned down than another player.",
            },
            {
                key: "buildingsHealthSum",
                winReason: "You had the highest health sum among your Buildings.",
                loseReason: "You had a lower health sum than another player.",
            },
        ];

        for(var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            var calculation = {
                player: player,
                headquartersHealth: player.headquarters.health,
            };

            calculation.buildingsAlive = 0;
            calculation.buildingsHealthSum = 0;
            for(var j = 0; j < player.buildings.length; j++) {
                var building = player.buildings[j];
                calculation.buildingsAlive += Number(building.health > 0); // alive will be 1, burned down will be 0
                calculation.buildingsHealthSum += building.health;
            }

            calculations.push(calculation);
        }

        // try to find the winner via most Headquarters Health remaining by sorting based on that
        for(i = 0; i < winConditions.length; i++) {
            var winCondition = winConditions[i];
            calculations.sortDescending(winCondition.key);
            if(calculations[0][winCondition.key] > calculations[1][winCondition.key]) { // then we have a winner, otherwise two players tied for that win condition
                this.declareLosers(this.getOtherPlayers(calculations[0].player), reasonWhy + ": " + winCondition.loseReason);
                this.declareWinner(calculations[0].player, reasonWhy + ": " + winCondition.winReason);
                return;
            }
        }

        this._endGameViaCoinFlip();
    },

    //<<-- /Creer-Merge: added-functions -->>

});

module.exports = Game;
