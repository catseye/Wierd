/*
 * This file is part of yoob.js version 0.8
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
 * - make it load the initial state from a string in the reset(s) method
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
 * For every action 'foo', three methods are exposed on the yoob.Controller
 * object:
 *
 * - clickFoo
 *
 *   Called when the button associated button is clicked.
 *   Client code may call this method to simulate the button having been
 *   clicked, including respecting and changing the state of the buttons panel.
 *
 * - performFoo
 *
 *   Called by clickFoo to request the 'foo' action be performed.
 *   Responsible also for any Controller-related housekeeping involved with
 *   the 'foo' action.  Client code may call this method when it wants the
 *   controller to perform this action without respecting or changing the
 *   state of the button panel.
 *
 * - foo
 *
 *   Overridden (if necessary) by a subclass, or supplied by an instantiator,
 *   of yoob.Controller to implement some action.  In particular, 'step' needs
 *   to be implemented this way.  Client code should not call these methods
 *   directly.
 *
 * The clickFoo methods take one argument, an event structure.  None of the
 * other functions take an argument, with the exception of performReset() and
 * reset(), which take a single argument, the text-encoded state to reset to.
 */
yoob.Controller = function() {
    var STOPPED = 0;   // the program has terminated (itself)
    var PAUSED = 1;    // the program is ready to step/run (stopped by user)
    var RUNNING = 2;   // the program is running
    var BLOCKED = 3;   // the program is waiting for more input

    /*
     * panelContainer: an element into which to add the created button panel
     * (if you do not give this, no panel will be created.  You're on your own.)
     * step: if given, if a function, it becomes the step() method on this
     * reset: if given, if a function, it becomes the reset() method on this
     */
    this.init = function(cfg) {
        this.delay = 100;
        this.state = STOPPED;
        this.controls = {};
        this.resetState = undefined;
        if (cfg.panelContainer) {
            this.panel = this.makePanel();
            cfg.panelContainer.appendChild(this.panel);
        }
        if (cfg.step) {
            this.step = cfg.step;
        }
        if (cfg.reset) {
            this.reset = cfg.reset;
        }
        return this;
    };

    /******************
     * UI
     */
    this.makePanel = function() {
        var panel = document.createElement('div');
        var $this = this;

        var makeEventHandler = function(control, upperAction) {
            return function(e) {
                $this['click' + upperAction](control);
            };
        };

        var makeButton = function(action) {
            var button = document.createElement('button');
            var upperAction = action.charAt(0).toUpperCase() + action.slice(1);
            button.innerHTML = upperAction;
            button.style.width = "5em";
            panel.appendChild(button);
            button.onclick = makeEventHandler(button, upperAction);
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

    /*
     * Override this to change how the delay is acquired from the 'speed'
     * control.
     */
    this.setDelayFrom = function(elem) {
        this.delay = elem.max - elem.value; // parseInt(elem.value, 10)
    };

    /******************
     * action: Step
     */
    this.clickStep = function(e) {
        if (this.state === STOPPED) return;
        this.clickStop();
        this.state = PAUSED;
        this.performStep();
    };

    this.performStep = function() {
        var code = this.step();
        if (code === 'stop') {
            this.clickStop();
            this.state = STOPPED;
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

    /******************
     * action: Start
     */
    this.clickStart = function(e) {
        this.performStart();
        if (this.controls.start) this.controls.start.disabled = true;
        if (this.controls.step) this.controls.step.disabled = false;
        if (this.controls.stop) this.controls.stop.disabled = false;
    };

    this.performStart = function() {
        this.start();
    };

    this.start = function() {
        if (this.intervalId !== undefined)
            return;
        this.performStep();
        var $this = this;
        this.intervalId = setInterval(function() {
            $this.performStep();
        }, this.delay);
        this.state = RUNNING;
    };

    /******************
     * action: Stop
     */
    this.clickStop = function(e) {
        this.performStop();
        if (this.controls.start) this.controls.start.disabled = false;
        if (this.controls.step) this.controls.step.disabled = false;
        if (this.controls.stop) this.controls.stop.disabled = true;
    };

    this.performStop = function() {
        this.stop();
        this.state = PAUSED;
    };

    this.stop = function() {
        if (this.intervalId === undefined)
            return;
        clearInterval(this.intervalId);
        this.intervalId = undefined;
    };

    /******************
     * action: Reset
     */
    this.clickReset = function(e) {
        this.clickStop();
        this.performReset();
        if (this.controls.start) this.controls.start.disabled = false;
        if (this.controls.step) this.controls.step.disabled = false;
        if (this.controls.stop) this.controls.stop.disabled = true;
    };

    this.performReset = function(state) {
        if (state !== undefined) {
            this.resetState = state;
        }
        this.reset(this.resetState);
    };

    this.reset = function(state) {
        alert("reset() NotImplementedError");
    };
};
