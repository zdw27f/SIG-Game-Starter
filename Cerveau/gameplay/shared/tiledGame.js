var Class = require(__basedir + "/utilities/class");
var BaseGame = require("./baseGame");

/**
 * @class TiledGame - a game that has a grid based map of tiles. This handles creating that initial map and hooking it up. That's it
 */
var TiledGame = Class(BaseGame, {
    /**
     * Initialized the map, which means all the Tiles. Call this once you've set mapWidth and mapHeight. If you wish to add data to Tiles on their creation override _createTile(data).
     */
    _initMap: function() {
        this.tiles.length = this.mapWidth * this.mapHeight; // indexed row-major order

        var x, y;

        for(x = 0; x < this.mapWidth; x++) {
            for(y = 0; y < this.mapHeight; y++) {
                this.tiles[x + y*this.mapWidth] = this._createTile({
                    x: x,
                    y: y,
                });
            }
        }

        // now all the tiles are created, so hook up their neighbors. Ideally neightbors never change so a delta is never sent after the initial state so this doesn't impact performance much, but it super handy for competitors.
        for(x = 0; x < this.mapWidth; x++) {
            for(y = 0; y < this.mapHeight; y++) {
                var tile = this.getTile(x, y);

                tile.tileNorth = this.getTile(x, y - 1);
                tile.tileEast = this.getTile(x + 1, y);
                tile.tileSouth = this.getTile(x, y + 1);
                tile.tileWest = this.getTile(x - 1, y);
            }
        }
    },

    /**
     * Valid adjacent directions for Tiles.
     *
     * @static
     * @type {Array.<string>}
     */
    tileDirections: ["North", "East", "South", "West"],

    /**
     * Inverts a direction string, e.g. "North" -> "South"
     *
     * @static
     * @param {string} direction - the direction string to invert
     * @returns {string|undefined} the direction inverted, e.g. "East" -> "West", undefined if the direction was not a valid direction string
     */
    invertTileDirection: function(direction) {
        switch(direction) {
            case "North": return "South";
            case "East": return "West";
            case "South": return "North";
            case "West": return "East";
        }
    },

    /**
     * Gets the tile at (x, y), or null if the co-ordinates are off-map
     *
     * @param {number} x - x position of the desired tile
     * @param {number} y - y position of the desired tile
     * @returns {Tile|null} the Tile at (x, y) if valid, null otherwise
     */
    getTile: function(x, y) {
        if(x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) { // bounds check
            return this.tiles[x + y*this.mapWidth];
        }

        return null;
    },

    /**
     * Exposed so sub classes can override this to add any initialization data as needed.
     *
     * @param {Object} data - the initialization data for the new tile. Feel free to dump values into it.
     * @returns {Tile} the newly created tile in the game.
     */
    _createTile: function(data) {
        return this.create("Tile", data);
    },
});

module.exports = TiledGame;
