// Web: A connection (edge) to a Nest (node) in the game that Spiders can converge on (regardless of owner). Spiders can travel in either direction on Webs.

const Class = require("classe");
const log = require(`${__basedir}/gameplay/log`);
const GameObject = require("./gameObject");

//<<-- Creer-Merge: requires -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

// any additional requires you want can be required here safely between Creer re-runs

//<<-- /Creer-Merge: requires -->>

// @class Web: A connection (edge) to a Nest (node) in the game that Spiders can converge on (regardless of owner). Spiders can travel in either direction on Webs.
let Web = Class(GameObject, {
    /**
     * Initializes Webs.
     *
     * @param {Object} data - a simple mapping passed in to the constructor with whatever you sent with it. GameSettings are in here by key/value as well.
     */
    init: function(data) {
        GameObject.init.apply(this, arguments);

        /**
         * How long this Web is, i.e., the distance between its nestA and nestB.
         *
         * @type {number}
         */
        this.length = this.length || 0;

        /**
         * How much weight this Web currently has on it, which is the sum of all its Spiderlings weight.
         *
         * @type {number}
         */
        this.load = this.load || 0;

        /**
         * The first Nest this Web is connected to.
         *
         * @type {Nest}
         */
        this.nestA = this.nestA || null;

        /**
         * The second Nest this Web is connected to.
         *
         * @type {Nest}
         */
        this.nestB = this.nestB || null;

        /**
         * All the Spiderlings currently moving along this Web.
         *
         * @type {Array.<Spiderling>}
         */
        this.spiderlings = this.spiderlings || [];

        /**
         * How much weight this Web can take before snapping and destroying itself and all the Spiders on it.
         *
         * @type {number}
         */
        this.strength = this.strength || 0;


        //<<-- Creer-Merge: init -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

        // put any initialization logic here. the base variables should be set from 'data' above

        this.game.webs.push(this);
        this.nestA.webs.push(this);
        this.nestB.webs.push(this);
        this.length = this.nestA.distanceTo(this.nestB);
        this.strength = this.game.initialWebStrength;
        this._maxStrength = Infinity;

        //<<-- /Creer-Merge: init -->>
    },

    gameObjectName: "Web",


    //<<-- Creer-Merge: added-functions -->> - Code you add between this comment and the end comment will be preserved between Creer re-runs.

    /**
     * Snaps the web, killing all spiders on it.
     */
    snap: function() {
        if(this.hasSnapped()) {
            return; // as it's snapping more than once at the end of the turn
        }

        var spiderlings = this.spiderlings.clone();
        for(var i = spiderlings.length - 1; i >= 0; i--) { // reverse order as they will remove themselves from the end of the list, so we don't have to shift everything n times
            spiderlings[i].kill();
        }

        this.strength = -1; // has now snapped

        // if any Spiderlings are doing something with this web on nestA or B, tell them to finish
        var sideSpiders = this.getSideSpiders();
        for(i = 0; i < sideSpiders.length; i++) {
            var spider = sideSpiders[i];
            if(spider.cuttingWeb === this || spider.strengtheningWeb === this || spider.weakeningWeb === this) { // then they may be busy with this
                spider.finish(true);
            }
        }

        this.game.webs.removeElement(this);

        this.nestA.webs.removeElement(this);
        this.nestA = null;

        this.nestB.webs.removeElement(this);
        this.nestB = null;
    },

    /**
     * Returns if this Web has been snapped, and is thus no longer part of the game.
     *
     * @returns {boolean} true if the web has been snapped (is dead), false otherwise
     */
    hasSnapped: function() {
        return this.strength === -1;
    },

    /**
     * Gets a new array containing all the spiders on this Web's nestA & B.
     *
     * @returns {Array.<Spider>} an array of Spiders in nest A and B (the sides of this web).
     */
    getSideSpiders: function() {
        var spiders = this.nestA.spiders.slice();
        for(var i = 0; i < this.nestB.spiders.length; i++) {
            spiders.push(this.nestB.spiders[i]);
        }
        return spiders;
    },

    /**
     * Checks if the Web is connected to some Nest
     *
     * @param {Nest} nest - nest to check if is connected to at nestA or nestB
     * @param {Nest} [otherNest] - if passed then checks if nestA and nestB are otherNest and the previous arg nest (in either order)
     * @returns {boolean|undefined} True if it is connected to that web, false otherwise, undefined if nest is null.
     */
    isConnectedTo: function(nest, otherNest) {
        if(!nest) {
            return undefined;
        }

        if(!otherNest) {
            return this.nestA === nest || this.nestB === nest;
        }
        else {
            return (this.nestA === nest && this.nestB === otherNest) || (this.nestA === otherNest && this.nestB === nest);
        }
    },

    /**
     * Gets the other nest, given one of its nests A or B
     *
     * @param {Nest} nest - the nest to get the other one
     * @returns {Nest|undefined} the other Nest that the passed in nest is not, undefined is nest is not part of this Web.
     */
    getOtherNest: function(nest) {
        if(!this.isConnectedTo(nest)) {
            return undefined;
        }

        return this.nestA === nest ? this.nestB : this.nestA;
    },

    /**
     * Should be called whenever something changes on the web, so it need to re-calculate its current load and maybe snap.
     *
     * @param {number} num - the load (weight) of a spiderling to add
     */
    addLoad: function(num) {
        this.load = Math.max(this.load + num, 0);

        if(this.load > this.strength) {
            this.snap();
        }
    },

    /**
     * Adds some number to this web's strength, and might snap it
     *
     * @param {number} num - number to add to this Web's strength
     */
    addStrength: function(num) {
        this.strength = Math.clamp(this.strength + num, 1, this._maxStrength);
        if(this.load >= this.strength) {
            this.snap();
        }
    },


    // You can add additional functions here. These functions will not be directly callable by client AIs

    //<<-- /Creer-Merge: added-functions -->>

});

module.exports = Web;
