// Game: There's an infestation of enemy spiders challenging your queen broodmother spider! Protect her and attack the other broodmother in this turn based, node based, game.

const Class = require("classe");
const log = require(`${__basedir}/gameplay/log`);
const TwoPlayerGame = require(`${__basedir}/gameplay/shared/twoPlayerGame`);
const TurnBasedGame = require(`${__basedir}/gameplay/shared/turnBasedGame`);

//<<-- Creer-Merge: requires -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

// any additional requires you want can be required here safely between Creer re-runs

//<<-- /Creer-Merge: requires -->>

// @class Game: There's an infestation of enemy spiders challenging your queen broodmother spider! Protect her and attack the other broodmother in this turn based, node based, game.
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
         * The speed at which Cutters work to do cut Webs.
         *
         * @type {number}
         */
        this.cutSpeed = this.cutSpeed || 0;

        /**
         * Constant used to calculate how many eggs BroodMothers get on their owner's turns.
         *
         * @type {number}
         */
        this.eggsScalar = this.eggsScalar || 0;

        /**
         * A mapping of every game object's ID to the actual game object. Primarily used by the server and client to easily refer to the game objects via ID.
         *
         * @type {Object.<string, GameObject>}
         */
        this.gameObjects = this.gameObjects || {};

        /**
         * The starting strength for Webs.
         *
         * @type {number}
         */
        this.initialWebStrength = this.initialWebStrength || 0;

        /**
         * The maximum number of turns before the game will automatically end.
         *
         * @type {number}
         */
        this.maxTurns = this.maxTurns || 0;

        /**
         * The speed at which Spiderlings move on Webs.
         *
         * @type {number}
         */
        this.movementSpeed = this.movementSpeed || 0;

        /**
         * Every Nest in the game.
         *
         * @type {Array.<Nest>}
         */
        this.nests = this.nests || [];

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

        /**
         * The speed at which Spitters work to spit new Webs.
         *
         * @type {number}
         */
        this.spitSpeed = this.spitSpeed || 0;

        /**
         * How much web strength is added or removed from Webs when they are weaved.
         *
         * @type {number}
         */
        this.weavePower = this.weavePower || 0;

        /**
         * The speed at which Weavers work to do strengthens and weakens on Webs.
         *
         * @type {number}
         */
        this.weaveSpeed = this.weaveSpeed || 0;

        /**
         * Every Web in the game.
         *
         * @type {Array.<Web>}
         */
        this.webs = this.webs || [];


        //<<-- Creer-Merge: init -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        this.maxTurns = 300;
        this.movementSpeed = 10;
        this.cutSpeed = 2;
        this.spitSpeed = 24;
        this.weaveSpeed = 16;
        this.initialWebStrength = 5;
        this.weavePower = 1;
        this.eggsScalar = 0.10;


        // used for map generation
        this._mapWidth = 400;
        this._mapHeight = 200;
        this._deadzone = 25;
        this._maxNests = 48; // per side, as are the folling
        this._minNests = 8;
        this._maxWebs = 20;
        this._minWebs = 0;
        this._minCrossWebs = 0;
        this._maxCrossWebs = 4;

        //<<-- /Creer-Merge: init -->>
    },

    name: "Spiders",

    aliases: [
        //<<-- Creer-Merge: aliases -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.
        "MegaMinerAI-17-Spiders",
        //<<-- /Creer-Merge: aliases -->>
    ],



    /**
     * This is called when the game begins, once players are connected and ready to play, and game objects have been initialized. Anything in init() may not have the appropriate game objects created yet..
     */
    begin: function() {
        TurnBasedGame.begin.apply(this, arguments);
        TwoPlayerGame.begin.apply(this, arguments);

        //<<-- Creer-Merge: begin -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        // genreate Nests on the left
        var numNests = Math.randomInt(this._maxNests, this._minNests);
        var retries = 1000; // try to place nests this many times before giving up because the map is probably too congested
        for(var i = 0; i < numNests; i++) {
            while(--retries > 0) {
                var point = {
                    x: Math.randomInt(this._mapWidth/2 - this._deadzone/2),
                    y: Math.randomInt(this._mapHeight),
                };

                for(i = 0; i < this.nests.length; i++) {
                    if(Math.euclideanDistance(this.nests[i], point) <= this._deadzone) {
                        point = null;
                        break;
                    }
                }

                if(point) {
                    this.create("Nest", point);
                    break; // out of while(true), as the point was valid
                }
            }
        }

        numNests = this.nests.length;
        var nestA, nestB;

        // geneate Webs on the left
        var numWebs = Math.randomInt(this._maxWebs, this._minWebs);
        for(i = 0; i < numWebs; i++) {
            nestA = this.nests.randomElement();
            nestB = nestA;
            while(nestB === nestA) {
                nestB = this.nests.randomElement();
            }

            this.create("Web", {
                nestA: nestA,
                nestB: nestB,
            });
        }

        // create the BroodMother
        this.players[0].broodMother = this.create("BroodMother", {
            owner: this.players[0],
            nest: this.nests.randomElement(),
        });

        // now mirror it

        var mirroring;
        // mirror the Nests
        for(i = 0; i < numNests; i++) {
            mirroring = this.nests[i];
            var mirrored = this.create("Nest", {
                x: this._mapWidth - mirroring.x,
                y: mirroring.y,
            });

            // these are not exposed to competitors
            mirroring.mirrorNest = mirrored;
            mirrored.mirrorNest = mirroring;
        }

        // mirror the Webs
        for(i = 0; i < numWebs; i++) {
            mirroring = this.webs[i];

            this.create("Web", {
                nestA: mirroring.nestA.mirrorNest,
                nestB: mirroring.nestB.mirrorNest,
            });
        }

        // webs that cross the middle of the game
        var numCrossWebs = Math.randomInt(this._minCrossWebs, this._maxCrossWebs);
        for(i = 0; i < numCrossWebs; i++) {
            nestA = this.nests[Math.randomInt(0, numNests-1)]; // the first half the the array has the nests on player 0's side
            nestB = this.nests[Math.randomInt(numNests, numNests*2 - 1)]; // and the other half has playe 1's
            this.create("Web", {
                nestA: nestA,
                nestB: nestB,
            });

            if(nestA.mirrorNest !== nestB) {
                // this is the mirror of the web created above, so long as the nests don't mirror each other already
                this.create("Web", {
                    nestA: nestA.mirrorNest,
                    nestB: nestB.mirrorNest,
                });
            }
        }

        // mirror the BroodMother
        this.players[1].broodMother = this.create("BroodMother", {
            owner: this.players[1],
            nest:this.players[0].broodMother.nest.mirrorNest,
        });

        this._giveEggs(this.players[0]);


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

    _playerStartingTime: 12e10, // 120 seconds in nanoseconds

    /**
     * Calculates, and gives eggs to all the BroodMothers.
     *
     * @param {Player} player - the player to give their broodmother eggs
     */
    _giveEggs: function(player) {
        player.broodMother.eggs = Math.ceil((player.maxSpiderlings - player.spiders.length - 1) * this.eggsScalar); // -1 for the BroodMother in player.spiders that is not a Spiderling
    },

    /**
     * Called when the next turn needs to transition
     *
     * @override
     */
    nextTurn: function() {
        var returned = TurnBasedGame.nextTurn.apply(this, arguments);

        var i;
        // before we go to the next player's turn, have all the spiders that are busy do stuff.
        // This ensures spiders finish work on the OPPONENT'S turn, so opponents have at least 1 turn to react.
        var movers = [];
        for(var j = 0; j < this.currentPlayer.spiders.length; j++) {
            var spider = this.currentPlayer.spiders[j];

            if(spider.workRemaining > 0) {
                spider.workRemaining -= Math.sqrt(spider.coworkers.length + 1); // + 1 for the spiderling itself

                if(spider.workRemaining <= 0) { // then they are done
                    if(spider.busy === "Moving") {
                        movers.push(spider); // they will finish moving AFTER other actions (e.g. cut)
                    }
                    else { // they finish now
                        for(i = 0; i < spider.coworkers.length; i++) { // all the co-workers are done too
                            spider.coworkers[i].finish(true); // force finish them
                        }

                        spider.finish();
                    }
                }
            }
        }

        for(i = 0; i < movers.length; i++) {
            var mover = movers[i];
            if(!mover.isDead) { // they may have died because of an action above (e.g. cut)
                movers[i].finish(); // now the spiderling moving can finish, because his Web may have been snapped above
            }
        }

        this._giveEggs(this.currentPlayer);

        if(this._checkPrimaryWin()) {
            return returned; // just incase we add code after this check, as if the primary win condition happens we need to exit the game immediately
        }

        return returned;
    },


    /**
     * Checks if the game is over because the primary win condition was reached (broodmother died), and delcares winners/losers as such
     *
     * @param {boolean} True if the game is over, false otherwise
     * @returns {boolean} true if winner was found, false otherwise
     */
    _checkPrimaryWin: function() {
        var losers = [];
        var stillPlaying = [];
        for(var i = 0; i < this.players.length; i++) {
            var player = this.players[i];

            if(player.broodMother.isDead) {
                losers.push(player);
            }
            else {
                stillPlaying.push(player);
            }
        }

        if(losers.length > 0) { // someone lost
            if(losers.length === this.players.length) {
                this._secondaryWin("All BroodMothers died on same turn");
            }
            else {
                for(i = 0; i < losers.length; i++) {
                    var loser = losers[i];
                    if(!loser.lost) { // then they JUST lost
                        this.declareLoser(loser, "BroodMother died.");
                    }
                }

                if(stillPlaying.length === 1) { // they won!
                    this.declareWinner(stillPlaying[0], "Eliminated enemy BroodMother!");
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * declares winners and losers based on win/loses
     *
     * @param {boolean} secondaryReason - True if the game is over, false otherwise
     */
    _secondaryWin: function(secondaryReason) {
        var winner;
        var players = this.players.clone();
        players.sort(function(a, b) {
            return b.broodMother.health - a.broodMother.health;
        });

        // check if one player has more health in his broodmother than the rest
        if(players[0].broodMother.health !== players[1].broodMother.health) {
            winner = players.shift();
            this.declareWinner(winner, "{} - BroodMother has the most remaining health ({}).".format(secondaryReason, winner.broodMother.health));
            this.declareLosers(players, "{} - BroodMother has less health remaining than winner.".format(secondaryReason));
            return;
        }

        // check if one player "controls" more Nests than the other player
        // A Nest is controlled if one player owns more Spiderlings than the other player on it
        var areasOwned = [0, 0];
        for(var i = 0; i < this.nests.length; i++) {
            var counts = [0, 0];
            for(var j = 0; j < this.nests[i].spiders.length; j++) {
                counts[this.nests[i].spiders[j].owner.id]++;
            }

            if(counts[0] > counts[1]) {
                areasOwned[0]++;
            }
            else if(counts[0] < counts[1]) {
                areasOwned[1]++;
            }
        }

        winner = null;
        var loser = null;
        var winnerCount = 0;

        if(areasOwned[0] > areasOwned[1]) {
            winner = this.players[0];
            loser = this.players[1];
            winnerCount = areasOwned[0];
        }
        else if(areasOwned[1] > areasOwned[0]) {
            winner = this.players[1];
            loser = this.players[0];
            winnerCount = areasOwned[1];
        }

        if(winner) {
            this.declareWinner(winner, "{} - Player has the most Spiderlings on different Nests ({}).".format(secondaryReason, winnerCount));
            this.declareLoser(loser, "{} - Has less Spiderlings on different Nests.".format(secondaryReason));
            return;
        }

        // else check if one player has more spiders than the other
        players.sort(function(a, b) {
            return b.spiders.length - a.spiders.length;
        });

        if(players[0].spiders.length !== players[1].spiders.length) {
            winner = players.shift();
            this.declareWinner(winner, "{} - Player has the most Spiders ({}).".format(secondaryReason, winner.spiders.length));
            this.declareLosers(players, "{} - Player has less Spiders alive than winner.".format(secondaryReason));
            return;
        }

        this._endGameViaCoinFlip();
    },

    /**
     * Called when the maximum number of turns is reached, someone should win at this point
     *
     * @override
     */
    _maxTurnsReached: function() {
        TurnBasedGame._maxTurnsReached.apply(this, arguments);
        var returned = TurnBasedGame._maxTurnsReached.apply(this, arguments);

        this._secondaryWin("Max turns reached (" + this.maxTurns + ")");

        return returned;
    },

    //<<-- /Creer-Merge: added-functions -->>

});

module.exports = Game;
