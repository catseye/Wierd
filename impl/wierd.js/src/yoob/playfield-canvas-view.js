/*
 * This file is part of yoob.js version 0.6
 * Available from https://github.com/catseye/yoob.js/
 * This file is in the public domain.  See http://unlicense.org/ for details.
 */
if (window.yoob === undefined) yoob = {};

/*
 * A view (in the MVC sense) for depicting a yoob.Playfield (-compatible)
 * object on an HTML5 <canvas> element (or compatible object).
 *
 * TODO: don't necesarily resize canvas each time?
 * TODO: option to stretch content rendering to fill a fixed-size canvas
 */
yoob.PlayfieldCanvasView = function() {
    this.init = function(pf, canvas) {
        this.pf = pf;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cursors = [];
        this.fixedPosition = false;
        this.fixedSizeCanvas = false;
        this.drawCursorsFirst = true;
        this.setCellDimensions(8, 8);
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

    /*
     * Set the displayed dimensions of every cell.
     * cellWidth and cellHeight are canvas units of measure for each cell.
     * If cellWidth is undefined, the width of a character in the monospace
     * font of cellHeight pixels is used.
     */
    this.setCellDimensions = function(cellWidth, cellHeight) {
        this.ctx.textBaseline = "top";
        this.ctx.font = cellHeight + "px monospace";

        if (cellWidth === undefined) {
            cellWidth = this.ctx.measureText("@").width;
        }

        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
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
     * Draws cells of the Playfield in a drawing context.
     * cellWidth and cellHeight are canvas units of measure.
     *
     * The default implementation tries to call a .draw() method on the cell's
     * value, if one exists, and just renders it as text, in black, if not.
     *
     * Override if you wish to draw elements in some other way.
     */
    this.drawCell = function(ctx, value, playfieldX, playfieldY,
                             canvasX, canvasY, cellWidth, cellHeight) {
        if (value.draw !== undefined) {
            value.draw(ctx, playfieldX, playfieldY, canvasX, canvasY,
                       cellWidth, cellHeight);
        } else {
            ctx.fillStyle = "black";
            ctx.fillText(value.toString(), canvasX, canvasY);
        }
    };

    /*
     * Draws the Playfield in a drawing context.
     * cellWidth and cellHeight are canvas units of measure for each cell.
     * offsetX and offsetY are canvas units of measure for the top-left
     *   of the entire playfield.
     */
    this.drawContext = function(ctx, offsetX, offsetY, cellWidth, cellHeight) {
        var self = this;
        this.pf.foreach(function (x, y, value) {
            self.drawCell(ctx, value, x, y,
                          offsetX + x * cellWidth, offsetY + y * cellHeight,
                          cellWidth, cellHeight);
        });
    };

    this.drawCursors = function(ctx, offsetX, offsetY, cellWidth, cellHeight) {
        var cursors = this.cursors;
        for (var i = 0; i < cursors.length; i++) {
            cursors[i].drawContext(
              ctx,
              offsetX + cursors[i].x * cellWidth,
              offsetY + cursors[i].y * cellHeight,
              cellWidth, cellHeight
            );
        }
    };

    /*
     * Draw the Playfield, and its set of Cursors, on the canvas element.
     * Resizes the canvas to the needed dimensions first.
     */
    this.draw = function() {
        var canvas = this.canvas;
        var ctx = canvas.getContext('2d');
        var cellWidth = this.cellWidth;
        var cellHeight = this.cellHeight;
        var cursors = this.cursors;

        var width = this.getExtentX();
        var height = this.getExtentY();

        canvas.width = width * cellWidth;
        canvas.height = height * cellHeight;

        this.ctx.textBaseline = "top";
        this.ctx.font = cellHeight + "px monospace";

        var offsetX = 0;
        var offsetY = 0;

        if (!this.fixedPosition) {
            offsetX = (this.getLowerX() || 0) * cellWidth * -1;
            offsetY = (this.getLowerY() || 0) * cellHeight * -1;
        }

        if (this.drawCursorsFirst) {
            this.drawCursors(ctx, offsetX, offsetY, cellWidth, cellHeight);
        }

        this.drawContext(ctx, offsetX, offsetY, cellWidth, cellHeight);
        
        if (!this.drawCursorsFirst) {
            this.drawCursors(ctx, offsetX, offsetY, cellWidth, cellHeight);
        }
    };

};
