/*
 * This file is part of yoob.js version 0.8-PRE
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
 *   - reset
 *
 * - a slider control which adjusts the speed of program state evolution.
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
 * the program state.)
 */
yoob.Controller = function() {
    var STOPPED = 0;   // the program has terminated (itself)
    var PAUSED = 1;    // the program is ready to step/run (stopped by user)
    var RUNNING = 2;   // the program is running
    var BLOCKED = 3;   // the program is waiting for more input

    this.intervalId = undefined;
    this.delay = 100;
    this.state = STOPPED;

    this.input = undefined;

    this.speed = undefined;
    this.controls = {};

    var _makeEventHandler = function(controller, control, action) {
        if (controller['click_' + action] !== undefined) {
            action = 'click_' + action;
        }
        return function(e) {
            controller[action](control);
        };
    };

    /*
     * Single argument is a dictionary (object) where the keys
     * are the actions a controller can undertake, and the values
     * are either DOM elements or strings; if strings, DOM elements
     * with those ids will be obtained from the document and used.
     *
     * When the button associated with e.g. 'start' is clicked,
     * the corresponding method (in this case, 'click_start()')
     * on this Controller will be called.  These functions are
     * responsible for changing the state of the Controller (both
     * the internal state, and the enabled status, etc. of the
     * controls), and for calling other methods on the Controller
     * to implement the particulars of the action.
     *
     * For example, 'click_step()' calls 'performStep()' which
     * calls 'step()' (which a subclass or instantiator must
     * provide an implementation for.)
     *
     * To simulate one of the buttons being clicked, you may
     * call 'click_foo()' yourself in code.  However, that will
     * be subject to the current restrictions of the interface.
     * You may be better off calling one of the "internal" methods
     * like 'performStep()'.
     */
    this.connect = function(dict) {
        var $this = this;

        var keys = ["start", "stop", "step", "reset"];
        for (var i in keys) {
            var key = keys[i];
            var value = dict[key];
            if (typeof value === 'string') {
                value = document.getElementById(value);
            }
            if (value) {
                value.onclick = _makeEventHandler(this, value, key);
                this.controls[key] = value;
            }
        }

        var keys = ["speed", "input"];
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
                        $this.setDelayFrom($this.speed);
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

    this.load = function(text) {
        alert("load() NotImplementedError");
    };

    this.click_step = function(e) {
        if (this.state === STOPPED) return;
        this.click_stop();
        this.state = PAUSED;
        this.performStep();
    };

    this.performStep = function() {
        var code = this.step();
        if (code === 'stop') {
            this.terminate();
        } else if (code === 'block') {
            this.state = BLOCKED;
        }
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
        /* why is this check here? ... */
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

    this.click_reset = function(e) {
        this.click_stop();
        // this.load(this.source.value);
        if (this.controls.start) this.controls.start.disabled = false;
        if (this.controls.step) this.controls.step.disabled = false;
        if (this.controls.stop) this.controls.stop.disabled = true;
    };

    /*
     * Override this to change how the delay is acquired from the 'speed'
     * element.
     */
    this.setDelayFrom = function(elem) {
        this.delay = elem.max - elem.value;
    };

    this.makeButtonPanel = function(container) {
        var buttonPanel = document.createElement('div');
        container.appendChild(buttonPanel);
        var $this = this;
        var makeButton = function(action) {
            var button = document.createElement('button');
            button.innerHTML = action.charAt(0).toUpperCase() + action.slice(1);
            button.style.width = "5em";
            buttonPanel.appendChild(button);
            button.onclick = _makeEventHandler($this, button, action);
            $this.controls[action] = button;
            return button;
        };
        var keys = ["start", "stop", "step", "load", "reset"];
        for (var i = 0; i < keys.length; i++) {
            makeButton(keys[i]);
        }
        return buttonPanel;
    };
};
