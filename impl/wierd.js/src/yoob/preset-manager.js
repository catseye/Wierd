/*
 * This file is part of yoob.js version 0.8-PRE
 * Available from https://github.com/catseye/yoob.js/
 * This file is in the public domain.  See http://unlicense.org/ for details.
 */
if (window.yoob === undefined) yoob = {};

/*
 * An object for managing a set of "presets" -- which, for an esolang,
 * might be example programs; for an emulator, might be ROM images;
 * for a control panel, may be pre-selected combinations of settings;
 * and so forth.
 *
 * Mostly intended to be connected to a yoob.Controller -- but need not be.
 */
yoob.PresetManager = function() {
    /*
     * The single argument is a dictionary (object) where the keys are:
     *
     *    selectElem: (required) the <select> DOM element that will be
     *        populated with the available example programs.  Selecting one
     *        will cause the .select() method of this manager to be called.
     *        it will also call .onselect if that method is present.
     *
     *    setPreset: (optional) a callback which will be called whenever
     *        a new preset is selected.  If this is not given, an individual
     *        callback must be supplied with each preset as it is added.
     */
    this.init = function(cfg) {
        this.selectElem = cfg.selectElem;
        if (cfg.setPreset) {
            this.setPreset = cfg.setPreset;
        }
        this.clear();
        var $this = this;
        this.selectElem.onchange = function() {
            $this._select(this.options[this.selectedIndex].value);
        }
        return this;
    };

    /*
     * Removes all options from the selectElem, and their associated data.
     */
    this.clear = function() {
        this.reactTo = {};
        while (this.selectElem.firstChild) {
            this.selectElem.removeChild(this.selectElem.firstChild);
        }
        this.add('(select one...)', function() {});
        return this;
    };

    /*
     * Adds a preset to this PresetManager.  When it is selected,
     * the given callback will be called, being passed the id as the
     * first argument.  If no callback is provided, the default callback,
     * configured with setPreset in the init() configuration, will be used.
     */
    this.add = function(id, callback) {
        var opt = document.createElement("option");
        opt.text = id;
        opt.value = id;
        this.selectElem.options.add(opt);
        var $this = this;
        this.reactTo[id] = callback || this.setPreset;
        return this;
    };

    this.setPreset = function(id) {
        alert("No default setPreset callback configured");
    };

    /*
     * Called by the selectElem's onchange event.  For sanity, you should
     * probably not call this yourself.
     */
    this._select = function(id) {
        this.reactTo[id](id);
        if (this.onselect) {
            this.onselect(id);
        }
    };

    /*
     * Call this to programmatically select an item.  This will change
     * the selected option in the selectElem and trigger the appropriate
     * callback in this PresetManager.
     */
    this.select = function(id) {
        var i = 0;
        var opt = this.selectElem.options[i];
        while (opt) {
            if (opt.value === id) {
                this.selectElem.selectedIndex = i;
                this._select(id);
                return this;
            }
            i++;
            opt = this.selectElem.options[i];
        }
        // if not found, select the "(select one...)" option
        this.selectElem.selectedIndex = 0;
        return this;
    };

    /*
     * When called, every DOM element in the document with the given
     * class will be considered a preset, and the manager
     * will be populated with these.  Generally the CSS for the class
     * will have `display: none` and the elements will be <div>s.
     *
     * callback is as described for the .add() method.
     */
    this.populateFromClass = function(className, callback) {
        var elements = document.getElementsByClassName(className);
        for (var i = 0; i < elements.length; i++) {
            var e = elements[i];
            this.add(e.id, callback);
        }
        return this;
    };
};
