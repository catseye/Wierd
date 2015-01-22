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
 * Like most yoob objects, it is initialized after creation by calling the
 * method `init` with a configuration object.  If a DOM element is passed
 * for `panelContainer` in the configuration, a panel containing a number
 * of UI controls will be created and appended to that container.  These
 * are:
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
 *
 * Some theory of operation:
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
yoob.Controller = function() {
    var STOPPED = 0;   // the program has terminated (itself)
    var PAUSED = 1;    // the program is ready to step/run (stopped by user)
    var RUNNING = 2;   // the program is running
    var BLOCKED = 3;   // the program is waiting for more input

    /*
     * panelContainer: an element into which to add the created button panel
     * (if you do not give this, no panel will be created.  You're on your own.)
     */
    this.init = function(cfg) {
        this.delay = 100;
        this.state = STOPPED;
        this.controls = {};
        if (cfg.panelContainer) {
            this.panel = this.makePanel();
            cfg.panelContainer.appendChild(this.panel);
        }
        return this;
    };

    this.makePanel = function(container) {
        var panel = document.createElement('div');
        container.appendChild(panel);
        var $this = this;

        var makeEventHandler = function(control, action) {
            if ($this['click_' + action] !== undefined) {
                action = 'click_' + action;
            }
            return function(e) {
                $this[action](control);
            };
        };

        var makeButton = function(action) {
            var button = document.createElement('button');
            button.innerHTML = action.charAt(0).toUpperCase() + action.slice(1);
            button.style.width = "5em";
            panel.appendChild(button);
            button.onclick = makeEventHandler(button, action);
            $this.controls[action] = button;
            return button;
        };
        var keys = ["start", "stop", "step", "reset"];
        for (var i = 0; i < keys.length; i++) {
            makeButton(keys[i]);
        }

        var slider = document.createElement('input');
        slider.type = "range";
        slider.min = 0;
        slider.max = 200;
        slider.value = 100;
        slider.onchange = function(e) {
            $this.setDelayFrom(slider);
            if ($this.intervalId !== undefined) {
                $this.stop();
                $this.start();
            }
        };

        panel.appendChild(slider);
        $this.controls.speed = slider;

        return panel;
    };

    this.connectInput = function(elem) {
        this.input = elem;
        this.input.onchange = function(e) {
            if (this.value.length > 0) {
                // weird, where is this from?
                $this.unblock();
            }
        }
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
     * control.
     */
    this.setDelayFrom = function(elem) {
        this.delay = elem.max - elem.value; // parseInt(elem.value, 10)
    };
};
