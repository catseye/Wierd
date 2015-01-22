"use strict";

function launch(prefix, container, config) {
    config = config || {};
    if (typeof(container) === 'string') {
        container = document.getElementById(container);
    }
    var deps = [
        "controller.js",
        "playfield.js",
        "playfield-canvas-view.js",
        "cursor.js",
        "stack.js",
        "element-factory.js",
        "preset-manager.js",
        "source-manager.js"
    ];
    var loaded = 0;
    for (var i = 0; i < deps.length; i++) {
        var elem = document.createElement('script');
        elem.src = prefix + deps[i];
        elem.onload = function() {
            if (++loaded != deps.length) return;

            var controlPanel = config.controlPanel || container;

            var viewPort = yoob.makeDiv(container);
            var canvas = yoob.makeCanvas(viewPort, 400, 400);

            var statePanel = yoob.makeDiv(controlPanel);
            yoob.makeSpan(statePanel, "Stack:");
            var stackDisplay = yoob.makeCanvas(statePanel, 400, 100);
            yoob.makeLineBreak(statePanel);
            yoob.makeSpan(statePanel, "Input:");
            var inputElem = yoob.makeTextInput(statePanel);
            yoob.makeLineBreak(statePanel);
            yoob.makeSpan(statePanel, "Output:");
            var outputElem = yoob.makeDiv(statePanel);
            yoob.makeLineBreak(statePanel);

            var editor = yoob.makeTextArea(container, 25, 40);

            WierdController.prototype = new yoob.Controller();
            var c = new WierdController();
            var v = new yoob.PlayfieldCanvasView;
            v.init(null, canvas);
            v.setCellDimensions(undefined, 6);
            c.init({
                playfieldView: v,
                stackCanvas: stackDisplay,
                inputElem: inputElem,
                outputElem: outputElem
            });

            var buttonPanel = c.makeButtonPanel(controlPanel);
            yoob.makeSpan(buttonPanel, "Speed:");
            var speedControl = yoob.makeSlider(buttonPanel, 0, 200, 100);
            var presetSelect = yoob.makeSelect(buttonPanel, "Preset:", []);

            c.connect({
                'speed': speedControl,
                'source': editor,
                'display': viewPort
            });
            c.click_load();

            var p = new yoob.PresetManager();
            p.init({
                'selectElem': presetSelect,
                'controller': c,
            });

            var setPreset = function(n) {
                c.click_stop(); // in case it is currently running
                c.loadSourceFromURL('../../../eg/' + n);
            };

            p.add('hello.w', setPreset);
            p.select('hello.w');
        };
        document.body.appendChild(elem);
    }
}

function WierdController() {
    var intervalId;

    var pf;
    var ip;
    var stack;
    var output;

    this.init = function(cfg) {
        pf = new yoob.Playfield();
        ip = new yoob.Cursor().init(1, 1, 1, 1);
        stack = new yoob.Stack();
        cfg.playfieldView.pf = pf; // setPlayfield, surely?
        this.view = cfg.playfieldView.setCursors([ip]);
        output = cfg.outputElem;
        this.stackCanvas = cfg.stackCanvas;
        this.inputElem = cfg.inputElem;
    };

    this.step = function() {
        if (this.tryAhead(0, true)) { // NOP
        } else if (this.tryAhead(45, true)) {
            stack.push(1);
            //console.log("[PUSH1]");
        } else if (this.tryAhead(315, true)) {
            /* hello.w relies on the fact that
              if there are <2 elements on the stack, it's a NOP */
            if (stack.size() >= 2) {
                var a = stack.pop();
                var b = stack.pop();
                stack.push(b - a);
                //console.log("[SUBT]");
            }
        } else if (this.tryAhead(90, false)) {
            var a = 0;
            if (stack.size() > 0) a = stack.pop();
            if (a === 0) {
                ip.rotateDegrees(90);
                //console.log("[THEN]");
            } else {
                ip.rotateDegrees(180);
                //console.log("[ELSE]");
            }
            ip.advance();
        } else if (this.tryAhead(270, false)) {
            var a = 0;
            if (stack.size() > 0) a = stack.pop();
            if (a === 0) {
                ip.rotateDegrees(270);
                //console.log("[THEN]");
            } else {
                ip.rotateDegrees(180);
                // console.log("[ELSE]");
            }
            ip.advance();
        } else if (this.tryAhead(135, true)) {
            var a = stack.pop();
            if (a !== 0) { /* spec says 0 is GET. in JC's interp, 0 is PUT. */
                var x = stack.pop();
                var y = stack.pop();
                var e = (pf.get(x, y) || ' ').charCodeAt(0);
                stack.push(e);
                //console.log("[GET]");
            } else {
                var x = stack.pop();
                var y = stack.pop();
                var c = String.fromCharCode(stack.pop());
                pf.put(x, y, c);
                //console.log("[PUT]");
            }
        } else if (this.tryAhead(225, true)) {
            var a = stack.pop();
            if (a === 0) {
                var c = this.inputElem.value;
                if (c === '') {
                    return 'block';
                }
                stack.push(c.charCodeAt(0));
                this.inputElem.value = c.substr(1);
                //console.log("[IN]");
            } else {
                var a = stack.pop();
                output.innerHTML += String.fromCharCode(a);
                //console.log("[OUT]");
            }
        } else {
            var lookahead = ip.clone();
            lookahead.advance();
            lookahead.advance();
            var there = pf.get(lookahead.x, lookahead.y);
            if (there != ' ' && there != undefined) {
                ip.advance();
                ip.advance();
                //console.log("[SPRK]");
            } else {
                return 'stop';
            }
        }

        this.view.draw();
        stack.drawCanvas(this.stackCanvas, 10, 10);
    };

    this.load = function(text) {
        pf.clear();
        stack = new yoob.Stack();
        pf.load(1, 1, text);
        ip.x = 1;
        ip.y = 1;
        ip.dx = 1;
        ip.dy = 1;
        this.view.draw();
        stack.drawCanvas(this.stackCanvas, 10, 10);
    };

    this.tryAhead = function(degrees, advance) {
        var lookahead = ip.clone();
        lookahead.rotateDegrees(degrees);
        lookahead.advance();
        var there = pf.get(lookahead.x, lookahead.y);
        //console.log(lookahead.x, lookahead.y, there);
        if (there != ' ' && there != undefined) {
            if (advance) {
                ip.rotateDegrees(degrees);
                ip.advance();
            }
            return true;
        }
        return false;
    };
};
