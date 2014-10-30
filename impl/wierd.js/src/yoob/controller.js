/*
 * This file is part of yoob.js version 0.6
 * Available from https://github.com/catseye/yoob.js/
 * This file is in the public domain.  See http://unlicense.org/ for details.
 */
if (window.yoob === undefined) yoob = {};

/*
 * A controller for executing(/animating/evolving) states such as esolang
 * program states or cellular automaton configurations.  For the sake of
 * convenience, we will refer to this as the _program state_, even though
 * it is of course highly adaptable and might not represent a "program".
 *
 * The controller can be connected to a UI in the DOM, consisting of:
 *
 * - a set of buttons which control the evolution of the state:
 *   - start
 *   - stop
 *   - step
 *   - load
 *   - edit
 *
 * - a slider control which adjusts the speed of program state evolution.
 *
 * - a `source` element from which an program state can be loaded,
 *   and which is generally assumed to support user-editing of the source.
 *   The `edit` button will cause the `source` to be shown and the `display`
 *   to be hidden, while the `load` button will load the program state from
 *   the `source`, hide the `source`, and show the `display`.
 *
 * - a `display` element on which the current program state will be
 *   depicted.  Note that the controller is not directly responsible for
 *   rendering the program state; use something like yoob.PlayfieldCanvasView
 *   for that instead.  The controller only knows about the `display` in order
 *   to hide it while the `source` is being edited and to show it after the
 *   `source` has been loaded.
 *
 * - an `input` element, which provides input to the running program.
 *
 * Each of these is optional, and if not configured, will not be used.
 *
 * To use a Controller, create a subclass of yoob.Controller and override
 * the following methods:
 * - make it evolve the state by one tick in the step() method
 * - make it load the state from a multiline string in the load() method
 *
 * In these methods, you will need to store the state (in whatever
 * representation you find convenient for processing and for depicting on
 * the `display` in some fashion) somehow.  You may store it in a closed-over
 * private variable, or in an attribute on your controller object.
 *
 * If you store in in an attribute on your controller object, you should use
 * the `.programState` attribute; it is reserved for this purpose.
 *
 * You should *not* store it in the `.state` attribute, as a yoob.Controller
 * uses this to track its own state (yes, it has its own state independent of
 * the program state.  at least potentially.)
 */
yoob.Controller = function() {
    var STOPPED = 0;   // the program has terminated (itself)
    var PAUSED = 1;    // the program is ready to step/run (stopped by user)
    var RUNNING = 2;   // the program is running
    var BLOCKED = 3;   // the program is waiting for more input

    this.intervalId = undefined;
    this.delay = 100;
    this.state = STOPPED;

    this.source = undefined;
    this.input = undefined;
    this.display = undefined;

    this.speed = undefined;
    this.controls = {};

    /*
     * This is not a public method.
     */
    this._makeEventHandler = function(control, key) {
        if (this['click_' + key] !== undefined) {
            key = 'click_' + key;
        }
        var $this = this;
        return function(e) {
            $this[key](control);
        };
    };

    /*
     * Single argument is a dictionary (object) where the keys
     * are the actions a controller can undertake, and the values
     * are either DOM elements or strings; if strings, DOM elements
     * with those ids will be obtained from the document and used.
     */
    this.connect = function(dict) {
        var $this = this;

        var keys = ["start", "stop", "step", "load", "edit"];
        for (var i in keys) {
            var key = keys[i];
            var value = dict[key];
            if (typeof value === 'string') {
                value = document.getElementById(value);
            }
            if (value) {
                value.onclick = this._makeEventHandler(value, key);
                this.controls[key] = value;
            }
        }

        var keys = ["speed", "source", "input", "display"];
        for (var i in keys) {
            var key = keys[i];
            var value = dict[key];
            if (typeof value === 'string') {
                value = document.getElementById(value);
            }
            if (value) {
                this[key] = value;
                // special cases
                if (key === 'speed') {
                    this.speed.value = this.delay;
                    this.speed.onchange = function(e) {
                        $this.delay = speed.value;
                        if ($this.intervalId !== undefined) {
                            $this.stop();
                            $this.start();
                        }
                    }
                } else if (key === 'input') {
                    this.input.onchange = function(e) {
                        if (this.value.length > 0) {
                            $this.unblock();
                        }
                    }
                }
            }
        }

        this.click_stop();
    };

    this.click_step = function(e) {
        if (this.state === STOPPED) return;
        this.click_stop();
        this.state = PAUSED;
        this.performStep();
    };

    /*
     * Override this and make it evolve the program state by one tick.
     * The method may also return a control code string:
     *
     * - `stop` to indicate that the program has terminated.
     * - `block` to indicate that the program is waiting for more input.
     */
    this.step = function() {
        alert("step() NotImplementedError");
    };

    this.performStep = function() {
        var code = this.step();
        if (code === 'stop') {
            this.terminate();
        } else if (code === 'block') {
            this.state = BLOCKED;
        }
    };

    this.click_load = function(e) {
        this.click_stop();
        this.load(this.source.value);
        this.state = PAUSED;
        if (this.controls.edit) this.controls.edit.style.display = "inline";
        if (this.controls.load) this.controls.load.style.display = "none";
        if (this.controls.start) this.controls.start.disabled = false;
        if (this.controls.step) this.controls.step.disabled = false;
        if (this.controls.stop) this.controls.stop.disabled = true;
        if (this.display) this.display.style.display = "block";
        if (this.source) this.source.style.display = "none";
    };

    this.load = function(text) {
        alert("load() NotImplementedError");
    };

    /*
     * Loads a source text into the source element.
     */
    this.loadSource = function(text) {
        if (this.source) this.source.value = text;
        this.load(text);
        this.state = PAUSED;
    };

    /*
     * Loads a source text into the source element.
     * Assumes it comes from an element in the document, so it translates
     * the basic HTML escapes (but no others) to plain text.
     */
    this.loadSourceFromHTML = function(html) {
        var text = html;
        text = text.replace(/\&lt;/g, '<');
        text = text.replace(/\&gt;/g, '>');
        text = text.replace(/\&amp;/g, '&');
        this.loadSource(text);
    };

    this.click_edit = function(e) {
        this.click_stop();
        if (this.controls.edit) this.controls.edit.style.display = "none";
        if (this.controls.load) this.controls.load.style.display = "inline";
        if (this.controls.start) this.controls.start.disabled = true;
        if (this.controls.step) this.controls.step.disabled = true;
        if (this.controls.stop) this.controls.stop.disabled = true;
        if (this.display) this.display.style.display = "none";
        if (this.source) this.source.style.display = "block";
    };

    this.click_start = function(e) {
        this.start();
        if (this.controls.start) this.controls.start.disabled = true;
        if (this.controls.step) this.controls.step.disabled = false;
        if (this.controls.stop) this.controls.stop.disabled = false;
    };

    this.start = function() {
        if (this.intervalId !== undefined)
            return;
        this.step();
        var $this = this;
        this.intervalId = setInterval(function() {
            $this.performStep();
        }, this.delay);
        this.state = RUNNING;
    };

    this.click_stop = function(e) {
        this.stop();
        this.state = PAUSED;
        if (this.controls.stop && this.controls.stop.disabled) {
            return;
        }
        if (this.controls.start) this.controls.start.disabled = false;
        if (this.controls.step) this.controls.step.disabled = false;
        if (this.controls.stop) this.controls.stop.disabled = true;
    };

    this.terminate = function(e) {
        this.stop();
        this.state = STOPPED;
        if (this.controls.start) this.controls.start.disabled = true;
        if (this.controls.step) this.controls.step.disabled = true;
        if (this.controls.stop) this.controls.stop.disabled = true;
    };

    this.stop = function() {
        if (this.intervalId === undefined)
            return;
        clearInterval(this.intervalId);
        this.intervalId = undefined;
    };
};
