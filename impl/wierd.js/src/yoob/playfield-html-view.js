/*
 * This file is part of yoob.js version 0.8-PRE
 * Available from https://github.com/catseye/yoob.js/
 * This file is in the public domain.  See http://unlicense.org/ for details.
 */
if (window.yoob === undefined) yoob = {};

/*
 * A view (in the MVC sense) for depicting a yoob.Playfield (-compatible)
 * object onto any DOM element that supports innerHTML.
 *
 * TODO: this may be incomplete; use at your own risk
 * TODO: have this and the canvas view inherit from a common ABC?
 */
yoob.PlayfieldHTMLView = function() {
    this.pf = undefined;
    this.element = undefined;

    this.init = function(pf, element) {
        this.pf = pf;
        this.element = element;
        this.cursors = [];
        return this;
    };

    /*** Chainable setters ***/

    /*
     * Set the list of cursors to the given list of yoob.Cursor (or compatible)
     * objects.
     */
    this.setCursors = function(cursors) {
        this.cursors = cursors;
        return this;
    };

    this.setPlayfield = function(pf) {
        this.pf = pf;
        return this;
    };

    /*
     * For compatibility with PlayfieldCanvasView.  Sets the font size.
     */
    this.setCellDimensions = function(cellWidth, cellHeight) {
        this.element.style.fontSize = cellHeight + "px";
        return this;
    };

    /*
     * Return the requested bounds of the occupied portion of the playfield.
     * "Occupation" in this sense includes all cursors.
     *
     * These may return 'undefined' if there is nothing in the playfield.
     *
     * Override these if you want to draw some portion of the
     * playfield which is not the whole playfield.
     */
    this.getLowerX = function() {
        var minX = this.pf.getMinX();
        for (var i = 0; i < this.cursors.length; i++) {
            if (minX === undefined || this.cursors[i].x < minX) {
                minX = this.cursors[i].x;
            }
        }
        return minX;
    };
    this.getUpperX = function() {
        var maxX = this.pf.getMaxX();
        for (var i = 0; i < this.cursors.length; i++) {
            if (maxX === undefined || this.cursors[i].x > maxX) {
                maxX = this.cursors[i].x;
            }
        }
        return maxX;
    };
    this.getLowerY = function() {
        var minY = this.pf.getMinY();
        for (var i = 0; i < this.cursors.length; i++) {
            if (minY === undefined || this.cursors[i].y < minY) {
                minY = this.cursors[i].y;
            }
        }
        return minY;
    };
    this.getUpperY = function() {
        var maxY = this.pf.getMaxY();
        for (var i = 0; i < this.cursors.length; i++) {
            if (maxY === undefined || this.cursors[i].y > maxY) {
                maxY = this.cursors[i].y;
            }
        }
        return maxY;
    };

    /*
     * Returns the number of occupied cells in the x direction.
     * "Occupation" in this sense includes all cursors.
     */
    this.getExtentX = function() {
        if (this.getLowerX() === undefined || this.getUpperX() === undefined) {
            return 0;
        } else {
            return this.getUpperX() - this.getLowerX() + 1;
        }
    };

    /*
     * Returns the number of occupied cells in the y direction.
     * "Occupation" in this sense includes all cursors.
     */
    this.getExtentY = function() {
        if (this.getLowerY() === undefined || this.getUpperY() === undefined) {
            return 0;
        } else {
            return this.getUpperY() - this.getLowerY() + 1;
        }
    };

    /*
     * Override to convert Playfield values to HTML.
     */
    this.render = function(value) {
        if (value === undefined) return ' ';
        return value;
    };

    /*
     * Render the playfield, as HTML, on the DOM element.
     */
    this.draw = function() {
        var text = "";
        for (var y = this.getLowerY(); y <= this.getUpperY(); y++) {
            var row = "";
            for (var x = this.getLowerX(); x <= this.getUpperX(); x++) {
                var rendered = this.render(this.pf.get(x, y));
                for (var i = 0; i < this.cursors.length; i++) {
                    if (this.cursors[i].x === x && this.cursors[i].y === y) {
                        rendered = this.cursors[i].wrapText(rendered);
                    }
                }
                row += rendered;
            }
            text += row + "\n";
        }
        this.element.innerHTML = text;
    };

};
