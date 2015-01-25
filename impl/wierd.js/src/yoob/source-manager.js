/*
 * This file is part of yoob.js version 0.8-PRE
 * Available from https://github.com/catseye/yoob.js/
 * This file is in the public domain.  See http://unlicense.org/ for details.
 */
if (window.yoob === undefined) yoob = {};

/*
 * A SourceManager co-operates with a Controller and maybe a PresetManager.
 * It is for editing a program/configuration in some editing interface
 * which is mutually exclusive, UI-wise, with the run/animation interface.
 */
yoob.SourceManager = function() {
    /*
     * editor: an element (usually a textarea) which stores the source code
     * display: an element which contains the animation/controller
     * storageKey: key under which sources will be saved/loaded from localStorage
     * panelContainer: an element into which to add the created button panel
     * (if you do not give this, no panel will be created.  You're on your own.)
     * onDone: if given, if a function, it becomes the onDone method on this
     */
    this.init = function(cfg) {
        this.supportsLocalStorage = (
            window['localStorage'] !== undefined &&
            window['localStorage'] !== null
        );
        this.editor = cfg.editor;
        this.display = cfg.display;
        this.storageKey = cfg.storageKey || 'default';
        this.controls = {};
        if (cfg.panelContainer) {
            this.panel = this.makePanel();
            cfg.panelContainer.appendChild(this.panel);
        }
        if (cfg.onDone) {
            this.onDone = cfg.onDone;
        }
        this.clickDone();
        return this;
    };

    this.makePanel = function() {
        var panel = document.createElement('div');
        var $this = this;
        var makeButton = function(action) {
            var button = document.createElement('button');
            var upperAction = action.charAt(0).toUpperCase() + action.slice(1);
            button.innerHTML = upperAction;
            button.style.width = "5em";
            panel.appendChild(button);
            button.onclick = function(e) {
                if ($this['click' + upperAction]) {
                    $this['click' + upperAction]();
                }
            }
            $this.controls[action] = button;
        };
        var keys = ["edit", "done", "load", "save"];
        for (var i = 0; i < keys.length; i++) {
            makeButton(keys[i]);
        }
        return panel;
    };

    this.clickEdit = function() {
        this.editor.style.display = 'block';
        this.display.style.display = 'none';
        this.controls.edit.disabled = true;
        var keys = ["done", "load", "save"];
        for (var i = 0; i < keys.length; i++) {
            this.controls[keys[i]].disabled = false;
        }
        this.onEdit();
    };

    this.clickDone = function() {
        this.editor.style.display = 'none';
        this.display.style.display = 'block';
        this.controls.edit.disabled = false;
        var keys = ["done", "load", "save"];
        for (var i = 0; i < keys.length; i++) {
            this.controls[keys[i]].disabled = true;
        }
        this.onDone();
    };

    this.clickLoad = function() {
        if (!this.supportsLocalStorage) {
            var s = "Your browser does not support Local Storage.\n\n";
            s += "You may instead open a local file in a text editor, ";
            s += "select all, copy to clipboard, then paste into ";
            s += "the textarea, to load a source you have saved locally.";
            alert(s);
            return;
        }
        this.loadSource(
            localStorage.getItem('yoob:' + this.storageKey + ':default')
        );
    };

    this.clickSave = function() {
        if (!this.supportsLocalStorage) {
            var s = "Your browser does not support Local Storage.\n\n";
            s += "You may instead select all in the textarea, copy to ";
            s += "clipboard, open a local text editor, paste in there, ";
            s += "and save, to save a source locally.";
            alert(s);
            return;
        }
        localStorage.setItem(
            'yoob:' + this.storageKey + ':default',
            this.getEditorText()
        );
    };

    this.onEdit = function() {
    };

    /*
     * Override this to load it into the controller
     */
    this.onDone = function() {
    };

    /*
     * Loads a source text into the editor element.
     */
    this.loadSource = function(text) {
        this.setEditorText(text);
        this.onDone();
    };

    /*
     * You may need to override if your editor is not a textarea.
     */
    this.setEditorText = function(text) {
        this.editor.value = text;
    };

    /*
     * You may need to override if your editor is not a textarea.
     */
    this.getEditorText = function() {
        return this.editor.value;
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

    /*
     * This is the basic idea, but not fleshed out yet.
     * - Should we cache the source somewhere?
     * - While we're waiting, should we disable the UI / show a spinny?
     */
    this.loadSourceFromURL = function(url, errorCallback) {
        var http = new XMLHttpRequest();
        var $this = this;
        if (!errorCallback) {
            errorCallback = function(http) {
                $this.loadSource(
                    "Error: could not load " + url + ": " + http.statusText
                );
            }
        }
        http.open("get", url, true);
        http.onload = function(e) {
            if (http.readyState === 4 && http.responseText) {
                if (http.status === 200) {
                    $this.loadSource(http.responseText);
                } else {
                    errorCallback(http);
                }
            }
        };
        http.send(null);
    };
};
