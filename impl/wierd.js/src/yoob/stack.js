/*
 * This file is part of yoob.js version 0.7-PRE
 * Available from https://github.com/catseye/yoob.js/
 * This file is in the public domain.  See http://unlicense.org/ for details.
 */
if (window.yoob === undefined) yoob = {};

/*
 * A (theoretically) unbounded first-in first-out stack.
 */
yoob.Stack = function() {
    this._store = {};
    this._top = 0;

    this.pop = function() {
        if (this._top === 0) {
            return undefined;
        }
        var result = this._store[this._top];
        this._top -= 1;
        return result;
    };

    this.push = function(value) {
        this._top += 1;
        this._store[this._top] = value;
    };

    this.size = function() {
        return this._top;
    };

    /*
     * Iterate over every value on the stack, top to bottom.
     * fun is a callback which takes two parameters:
     * position (0 === top of stack) and value.
     */
    this.foreach = function(fun) {
        for (var pos = this._top; pos > 0; pos--) {
            fun(this._top - pos, this._store[pos]);
        }
    };

    /*
     * Draws elements of the Stack in a drawing context.
     * x and y are canvas coordinates, and width and height
     * are canvas units of measure.
     * The default implementation just renders them as text,
     * in black.
     * Override if you wish to draw them differently.
     */
    this.drawElement = function(ctx, x, y, cellWidth, cellHeight, elem) {
        ctx.fillStyle = "black";
        ctx.fillText(elem.toString(), x, y);
    };

    /*
     * Draws the Stack in a drawing context.
     * cellWidth and cellHeight are canvas units of measure for each cell.
     */
    this.drawContext = function(ctx, cellWidth, cellHeight) {
        var $this = this;
        this.foreach(function (pos, elem) {
            $this.drawElement(ctx, 0, pos * cellHeight,
                              cellWidth, cellHeight, elem);
        });
    };

    /*
     * Draws the Stack on a canvas element.
     * Resizes the canvas to the needed dimensions.
     * cellWidth and cellHeight are canvas units of measure for each cell.
     */
    this.drawCanvas = function(canvas, cellWidth, cellHeight) {
        var ctx = canvas.getContext('2d');

        var width = 1;
        var height = this._top;

        if (cellWidth === undefined) {
            ctx.textBaseline = "top";
            ctx.font = cellHeight + "px monospace";
            cellWidth = ctx.measureText("@").width;
        }

        canvas.width = width * cellWidth;
        canvas.height = height * cellHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.textBaseline = "top";
        ctx.font = cellHeight + "px monospace";

        this.drawContext(ctx, cellWidth, cellHeight);
    };
};
