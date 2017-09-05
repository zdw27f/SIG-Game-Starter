// Job: Information about a beaver's job.

const Class = require("classe");
const log = require(`${__basedir}/gameplay/log`);
const GameObject = require("./gameObject");

//<<-- Creer-Merge: requires -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

const JobStats = require("./jobStats.json");

//<<-- /Creer-Merge: requires -->>

// @class Job: Information about a beaver's job.
let Job = Class(GameObject, {
    /**
     * Initializes Jobs.
     *
     * @param {Object} data - a simple mapping passed in to the constructor with whatever you sent with it. GameSettings are in here by key/value as well.
     */
    init: function(data) {
        GameObject.init.apply(this, arguments);

        /**
         * The number of actions this Job can make per turn.
         *
         * @type {number}
         */
        this.actions = this.actions || 0;

        /**
         * How many combined resources a beaver with this Job can hold at once.
         *
         * @type {number}
         */
        this.carryLimit = this.carryLimit || 0;

        /**
         * Scalar for how many branches this Job harvests at once.
         *
         * @type {number}
         */
        this.chopping = this.chopping || 0;

        /**
         * How much food this Job costs to recruit.
         *
         * @type {number}
         */
        this.cost = this.cost || 0;

        /**
         * The amount of damage this Job does per attack.
         *
         * @type {number}
         */
        this.damage = this.damage || 0;

        /**
         * How many turns a beaver attacked by this Job is distracted by.
         *
         * @type {number}
         */
        this.distractionPower = this.distractionPower || 0;

        /**
         * The amount of starting health this Job has.
         *
         * @type {number}
         */
        this.health = this.health || 0;

        /**
         * The number of moves this Job can make per turn.
         *
         * @type {number}
         */
        this.moves = this.moves || 0;

        /**
         * Scalar for how much food this Job harvests at once.
         *
         * @type {number}
         */
        this.munching = this.munching || 0;

        /**
         * The Job title.
         *
         * @type {string}
         */
        this.title = this.title || "";


        //<<-- Creer-Merge: init -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        // put any initialization logic here. the base variables should be set from 'data' above
        this.title = this.title || "Normal";

        // we have no actual stats at this point, so use the ones in the JobStats file
        let ourJobStats = JobStats.jobs[this.title];

        for(let key of Object.keys(JobStats.default)) {
            // set our value to the stat defined in our job in the JobStats file, otherwise use the default value
            this[key] = (key in ourJobStats) ? ourJobStats[key] : JobStats.default[key];
        }

        //<<-- /Creer-Merge: init -->>
    },

    gameObjectName: "Job",


    /**
     * Invalidation function for recruit
     * Try to find a reason why the passed in parameters are invalid, and return a human readable string telling them why it is invalid
     *
     * @param {Player} player - the player that called this.
     * @param {Tile} tile - The Tile that is a lodge owned by you that you wish to spawn the Beaver of this Job on.
     * @param {Object} args - a key value table of keys to the arg (passed into this function)
     * @returns {string|undefined} a string that is the invalid reason, if the arguments are invalid. Otherwise undefined (nothing) if the inputs are valid.
     */
    invalidateRecruit: function(player, tile, args) {
        // <<-- Creer-Merge: invalidateRecruit -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        if(!player || player !== this.game.currentPlayer) {
            return `Not ${player}'s turn.`;
        }
        if(!tile) {
            return `${tile} is not a valid Tile.`;
        }
        if(tile.lodgeOwner !== player) {
            return `${tile} is not owned by ${player}.`;
        }
        if(tile.beaver) {
            return `There's already ${tile.beaver} at that lodge`;
        }
        if(player.getAliveBeavers().length >= this.game.freeBeaversCount && tile.food < this.cost) {
            return `${tile} does not have enough food available. (${tile.food}/${this.cost})`;
        }

        // <<-- /Creer-Merge: invalidateRecruit -->>
    },

    /**
     * Recruits a Beaver of this Job to a lodge
     *
     * @param {Player} player - the player that called this.
     * @param {Tile} tile - The Tile that is a lodge owned by you that you wish to spawn the Beaver of this Job on.
     * @returns {Beaver} The recruited Beaver if successful, null otherwise.
     */
    recruit: function(player, tile) {
        // <<-- Creer-Merge: recruit -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        // if they have more beavers
        if(player.getAliveBeavers().length >= this.game.freeBeaversCount) {
            tile.food -= this.cost;
        }

        let beaver = this.game.create("Beaver", {
            job: this,
            owner: player,
            tile: tile,
            recruited: false,
        });

        return beaver;
        // <<-- /Creer-Merge: recruit -->>
    },


    //<<-- Creer-Merge: added-functions -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

    // You can add additional functions here. These functions will not be directly callable by client AIs

    //<<-- /Creer-Merge: added-functions -->>

});

module.exports = Job;
