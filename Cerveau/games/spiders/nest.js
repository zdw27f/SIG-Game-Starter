// Nest: A location (node) connected to other Nests via Webs (edges) in the game that Spiders can converge on, regardless of owner.

const Class = require("classe");
const log = require(`${__basedir}/gameplay/log`);
const GameObject = require("./gameObject");

//<<-- Creer-Merge: requires -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

// any additional requires you want can be required here safely between Creer re-runs

//<<-- /Creer-Merge: requires -->>

// @class Nest: A location (node) connected to other Nests via Webs (edges) in the game that Spiders can converge on, regardless of owner.
let Nest = Class(GameObject, {
    /**
     * Initializes Nests.
     *
     * @param {Object} data - a simple mapping passed in to the constructor with whatever you sent with it. GameSettings are in here by key/value as well.
     */
    init: function(data) {
        GameObject.init.apply(this, arguments);

        /**
         * All the Spiders currently located on this Nest.
         *
         * @type {Array.<Spider>}
         */
        this.spiders = this.spiders || [];

        /**
         * Webs that connect to this Nest.
         *
         * @type {Array.<Web>}
         */
        this.webs = this.webs || [];

        /**
         * The X coordinate of the Nest. Used for distance calculations.
         *
         * @type {number}
         */
        this.x = this.x || 0;

        /**
         * The Y coordinate of the Nest. Used for distance calculations.
         *
         * @type {number}
         */
        this.y = this.y || 0;


        //<<-- Creer-Merge: init -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        this.game.nests.push(this);

        //<<-- /Creer-Merge: init -->>
    },

    gameObjectName: "Nest",


    //<<-- Creer-Merge: added-functions -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

    // You can add additional functions here. These functions will not be directly callable by client AIs

    distanceTo: function(otherNest) {
        return Math.euclideanDistance(this, otherNest);
    },

    //<<-- /Creer-Merge: added-functions -->>

});

module.exports = Nest;
