"use strict";

function launch(prefix, container, config) {
    config = config || {};
    if (typeof(container) === 'string') {
        container = document.getElementById(container);
    }
    var deps = [
        "controller.js",
        "playfield.js",
        "playfield-html-view.js",
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

            var sourceRoot = config.sourceRoot || '../eg/';

            var controlPanel = config.controlPanel;
            if (!controlPanel) {
                controlPanel = yoob.makeDiv(container);
                controlPanel.style.textAlign = 'left';
            }

            /* --- state animation display --- */

            var viewPort = yoob.makeDiv(container);
            viewPort.style.textAlign = 'left';

            var programDisplay = yoob.makePre(viewPort);
            programDisplay.style.display = 'inline-block';
            programDisplay.style.fontSize = "6px";
            programDisplay.style.lineHeight = "6px";

            var statePanel = yoob.makeDiv(viewPort);
            statePanel.style.display = 'inline-block';
            statePanel.style.verticalAlign = 'top';
            statePanel.style.textAlign = 'left';
            yoob.makeSpan(statePanel, "Stack:");
            var stackDisplay = yoob.makeCanvas(statePanel, 400, 100);
            yoob.makeLineBreak(statePanel);
            yoob.makeSpan(statePanel, "Input:");
            var inputElem = yoob.makeTextInput(statePanel);
            yoob.makeLineBreak(statePanel);
            yoob.makeSpan(statePanel, "Output:");
            var outputElem = yoob.makeDiv(statePanel);
            outputElem.style.background = 'black';
            outputElem.style.color = 'green';
            outputElem.style.fontFamily = 'monospace';
            outputElem.style.width = '100%';
            outputElem.style.minHeight = '20px';
            yoob.makeLineBreak(statePanel);

            var editor = yoob.makeTextArea(container, 160, 80);
            editor.style.fontSize = "6px";
            editor.style.lineHeight = "6px";

            /* --- controller --- */

            var proto = new yoob.Controller();
            WierdController.prototype = proto;
            var c = new WierdController(proto);
            var v = new yoob.PlayfieldHTMLView;
            v.init(null, programDisplay);
            v.setCellDimensions(undefined, 6);
            c.init({
                panelContainer: controlPanel,
                playfieldView: v,
                stackCanvas: stackDisplay,
                inputElem: inputElem,
                outputElem: outputElem
            });

            /* --- source manager --- */

            var sm = (new yoob.SourceManager()).init({
                'editor': editor,
                'hideDuringEdit': [viewPort],
                'disableDuringEdit': [c.panel],
                'storageKey': 'wierd.js',
                'panelContainer': controlPanel,
                'onDone': function() {
                    c.performReset(this.getEditorText());
                }
            });

            /* --- presets --- */

            var presetSelect = yoob.makeSelect(c.panel, "Preset:", []);

            var p = new yoob.PresetManager();
            p.init({
                'selectElem': presetSelect,
                'setPreset': function(n) {
                    c.clickStop(); // in case it is currently running
                    sm.loadSourceFromURL(sourceRoot + n);
                    sm.onDone();
                }
            });
            p.add('hello.w');
            p.select('hello.w');
        };
        document.body.appendChild(elem);
    }
}

function WierdController(proto) {
    var intervalId;

    var pf;
    var ip;
    var stack;
    var output;

    this.init = function(cfg) {
        proto.init.apply(this, [cfg]);

        pf = new yoob.Playfield();
        ip = new yoob.Cursor().init(1, 1, 1, 1);
        stack = new yoob.Stack();
        this.view = cfg.playfieldView.setPlayfield(pf).setCursors([ip]);
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
                var y = stack.pop();
                var x = stack.pop();
                var e = (pf.get(x, y) || ' ').charCodeAt(0);
                stack.push(e);
                //console.log("[GET]");
            } else {
                var y = stack.pop();
                var x = stack.pop();
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

    this.reset = function(text) {
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
