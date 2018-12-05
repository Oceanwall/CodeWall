'use babel';

import { CompositeDisposable, Point } from 'atom';

const ATOM_DEFAULT_RULER_COLOR = "rgba(46, 61, 73, 1)";
const DEFAULT_ERROR_COLOR = "rgba(255, 0, 0, 1)";

export default {

  shortTermSubscriptions: null,
  longTermSubscriptions: null,
  currentlyActive: null,
  editorsBeingWatched: {},

  activate() {
    // Events subscribed to in Atom's system can be easily cleaned up with a CompositeDisposable
    this.longTermSubscriptions = new CompositeDisposable();
    this.currentlyActive = false;

    // Create links between package commands and code
    this.longTermSubscriptions.add(atom.commands.add('atom-workspace', {
      'codewall:turn-on': () => this.turnOn()
    }));

    this.longTermSubscriptions.add(atom.commands.add('atom-workspace', {
      'codewall:turn-off': () => this.turnOff()
    }));

    this.longTermSubscriptions.add(atom.commands.add('atom-workspace', {
      'codewall:change-options': () => this.openPackageSettings()
    }));
  },

  // Package configuration in settings
  config: {
    "rulerErrorColor": {
      "description": "Change the ruler's error color here.",
      "type": "color",
      "default": DEFAULT_ERROR_COLOR
    },
    "defaultRulerColor": {
      "description": "Change the default ruler color here.",
      "type": "color",
      "default": ATOM_DEFAULT_RULER_COLOR
    },
  },

  deactivate() {
    this.longTermSubscriptions.dispose();
  },

  // Called when the package is "turned-on"
  turnOn() {
    if (this.currentlyActive)
      return;

    this.shortTermSubscriptions = new CompositeDisposable();
    this.currentlyActive = true;

    // Turn on automatic updates for the active text editor.
    this.shortTermSubscriptions.add(atom.workspace.observeActiveTextEditor(editor => {
      if (editor) {
        // Whenever the active text editor changes, update.
        this.processTextEditor(editor);
        // Prevent text editors from being subscribed multiple times.
        // Uses editorsBeingWatched as a set, using the editors' IDs as keys.
        if (!this.editorsBeingWatched.hasOwnProperty(editor.id)) {
          this.editorsBeingWatched[editor.id] = true;
          // Subscribe this text editor to "change-on-update".
          this.shortTermSubscriptions.add(editor.onDidStopChanging(() => {
            this.processTextEditor(editor);
          }));
        }
      }
    }));
  },

  // Updates a text editor (highlight lines, ruler color)
  processTextEditor(editor) {
    if (!editor || !this.currentlyActive) {
      return;
    }

    let numLines = editor.getLineCount();
    let maxLineLength = editor.preferredLineLength;

    let violations = [];
    let isOver = false;

    // Start by removing all existing markers.
    for (let marker of editor.getMarkers()) {
      marker.destroy();
    }

    // For each line, check if that line goes past the ruler.
    for (let i = 0; i < numLines; i++) {
      let currentLineLength = editor.lineTextForBufferRow(i).length;
      // Keep track of those that exceed the ruler.
      if (currentLineLength > maxLineLength) {
        isOver = true;
        let violation = new Point(i, maxLineLength);
        violations.push(violation);
      }
    }

    if (isOver) {
      // Changes the color of every ruler of every text editor.
      // Hacky solution, but it works.
      for (let ruler of document.getElementsByClassName("wrap-guide")) {
        ruler.style.backgroundColor = atom.config.get('codewall.rulerErrorColor').toRGBAString();
      }

      // Highlights the violating lines.
      for (let violation of violations) {
        let marker = editor.markBufferPosition(violation, "never");
        editor.decorateMarker(marker, {type: 'line', class: 'ruler-error'})
      }
    }
    else {
      // Resets the color of every ruler of every text editor to the user-selected default color.
      for (let ruler of document.getElementsByClassName("wrap-guide")) {
        ruler.style.backgroundColor = atom.config.get('codewall.defaultRulerColor').toRGBAString();
      }
    }
  },

  // Called when the package is "turned-off"
  turnOff() {
    if (!this.currentlyActive)
      return;

    // Removes "text-editor update" subscriptions.
    this.currentlyActive = false;
    this.shortTermSubscriptions.dispose();
    this.editorsBeingWatched = {};

    // Destroys all line highlights, and resets all rulers to the (atom) default color.
    for (let editor of atom.textEditors.editors) {
      for (let marker of editor.getMarkers()) {
        marker.destroy();
      }

      for (let ruler of document.getElementsByClassName("wrap-guide")) {
        ruler.style.backgroundColor = ATOM_DEFAULT_RULER_COLOR;
      }
    }
  },

  // Opens this package's configuration tab.
  openPackageSettings() {
    atom.workspace.open("atom://config/packages/codewall");
  },

};
