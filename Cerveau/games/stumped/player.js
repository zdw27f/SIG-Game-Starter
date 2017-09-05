// Player: A player in this game. Every AI controls one player.

const Class = require("classe");
const log = require(`${__basedir}/gameplay/log`);
const GameObject = require("./gameObject");

//<<-- Creer-Merge: requires -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

// any additional requires you want can be required here safely between Creer re-runs

//<<-- /Creer-Merge: requires -->>

// @class Player: A player in this game. Every AI controls one player.
let Player = Class(GameObject, {
    /**
     * Initializes Players.
     *
     * @param {Object} data - a simple mapping passed in to the constructor with whatever you sent with it. GameSettings are in here by key/value as well.
     */
    init: function(data) {
        GameObject.init.apply(this, arguments);

        /**
         * The list of Beavers owned by this Player.
         *
         * @type {Array.<Beaver>}
         */
        this.beavers = this.beavers || [];

        /**
         * How many branches are required to build a lodge for this Player.
         *
         * @type {number}
         */
        this.branchesToBuildLodge = this.branchesToBuildLodge || 0;

        /**
         * What type of client this is, e.g. 'Python', 'JavaScript', or some other language. For potential data mining purposes.
         *
         * @type {string}
         */
        this.clientType = this.clientType || "";

        /**
         * A list of Tiles that contain lodges owned by this player.
         *
         * @type {Array.<Tile>}
         */
        this.lodges = this.lodges || [];

        /**
         * If the player lost the game or not.
         *
         * @type {boolean}
         */
        this.lost = this.lost || false;

        /**
         * The name of the player.
         *
         * @type {string}
         */
        this.name = this.name || "";

        /**
         * This player's opponent in the game.
         *
         * @type {Player}
         */
        this.opponent = this.opponent || null;

        /**
         * The reason why the player lost the game.
         *
         * @type {string}
         */
        this.reasonLost = this.reasonLost || "";

        /**
         * The reason why the player won the game.
         *
         * @type {string}
         */
        this.reasonWon = this.reasonWon || "";

        /**
         * The amount of time (in ns) remaining for this AI to send commands.
         *
         * @type {number}
         */
        this.timeRemaining = this.timeRemaining || 0;

        /**
         * If the player won the game or not.
         *
         * @type {boolean}
         */
        this.won = this.won || false;


        //<<-- Creer-Merge: init -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        // put any initialization logic here. the base variables should be set from 'data' above

        //<<-- /Creer-Merge: init -->>
    },

    gameObjectName: "Player",


    //<<-- Creer-Merge: added-functions -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

    // You can add additional functions here. These functions will not be directly callable by client AIs

    getAliveBeavers: function() {
        // return all our beavers and filter out dead ones (health === 0) concatenated with the newly spawned beavers
        // NOTE: only works when you call this on the current player (as they spawn the new beavers)
        return this.beavers.filter((beaver) => beaver.health > 0).concat(this.game.newBeavers);
    },

    calculateBranchesToBuildLodge: function() {
        // TODO: document this in the game rules
        this.branchesToBuildLodge = Math.ceil(Math.pow(this.game.lodgeCostConstant, this.lodges.length));
    },

    //<<-- /Creer-Merge: added-functions -->>

});

module.exports = Player;
