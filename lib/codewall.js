'use babel';

import { CompositeDisposable, Point } from 'atom';

export default {

  subscriptions: null,
  codewallActives: null,
  currentlyActive: null,

  activate() {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.codewallActives = new CompositeDisposable();
    this.currentlyActive = false;

    // Create links between package commands and code
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'codewall:turn-on': () => this.turnOn()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'codewall:turn-off': () => this.turnOff()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'codewall:change-options': () => this.openPackageSettings()
    }));

    this.subscriptions.add(atom.config.onDidChange('codewall.rulerErrorColor', this.rulerErrorColorChange));
    this.subscriptions.add(atom.config.onDidChange('codewall.defaultRulerColor', this.rulerColorChange));
  },

  config: {
    "rulerErrorColor": {
      "description": "Change the ruler's error color here.",
      "type": "color",
      "default": "rgba(255, 0, 0, 1)"
    },
    "defaultRulerColor": {
      "description": "Change the default ruler color here.",
      "type": "color",
      "default": "rgba(46, 61, 73, 1)"
    },
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  turnOn() {
    if (this.currentlyActive)
      return;

    this.currentlyActive = true;

    this.subscriptions.add(atom.workspace.observeActiveTextEditor(editor => {
      if (editor) {
        this.processTextEditor(editor);
        // Note: Can this be added multiple times to the same active text editor?
        this.subscriptions.add(editor.onDidStopChanging(() => {
          this.processTextEditor(editor);
        }));
      }
    }));
  },

  processTextEditor(editor) {
    if (!editor || !this.currentlyActive) {
      return;
    }

    let numLines = editor.getLineCount();
    let maxLineLength = editor.preferredLineLength;

    let violations = [];
    let isOver = false;

    // Begin by removing all existing markers.
    // (Possibly optimize in the future?)
    for (let marker of editor.getMarkers()) {
      marker.destroy();
    }

    for (let i = 0; i < numLines; i++) {
      let currentLineLength = editor.lineTextForBufferRow(i).length;
      if (currentLineLength > maxLineLength) {
        isOver = true;
        let violation = new Point(i, 80);
        violations.push(violation);
      }
    }

    if (isOver) {
      // Kind of hacky solution, but works.
      for (let ruler of document.getElementsByClassName("wrap-guide")) {
        ruler.style.backgroundColor = atom.config.get('codewall.rulerErrorColor');
      }

      for (let violation of violations) {
        let marker = editor.markBufferPosition(violation, "never");
        // Must add a class...
        editor.decorateMarker(marker, {type: 'line', class: 'ruler-error'})
      }
    }
    else {
      for (let ruler of document.getElementsByClassName("wrap-guide")) {
        ruler.style.backgroundColor = atom.config.get('codewall.defaultRulerColor');
      }
    }
  },

  turnOff() {
    if (!this.currentlyActive)
      return;

    this.currentlyActive = false;
    for (let editor of atom.textEditors.editors) {
      for (let marker of editor.getMarkers()) {
        marker.destroy();
      }

      for (let ruler of document.getElementsByClassName("wrap-guide")) {
        ruler.style.backgroundColor = "rgba(46, 61, 73, 1)";
      }
    }

    this.codewallActives.dispose();
  },

  openPackageSettings() {
    atom.workspace.open("atom://config/packages/codewall");
  },

  rulerErrorColorChange(event) {
    // May not be necessary...
    atom.config.set('codewall.rulerErrorColor', event.newValue.toRGBAString());

    for (let ruler of document.getElementsByClassName("wrap-guide")) {
      if (this.currentlyActive)
        ruler.style.backgroundColor = atom.config.get('codewall.rulerErrorColor');
    }
  },

  rulerColorChange(event) {
    atom.config.set('codewall.defaultRulerColor', event.newValue.toRGBAString());

    for (let ruler of document.getElementsByClassName("wrap-guide")) {
      if (!this.currentlyActive)
        ruler.style.backgroundColor = atom.config.get('codewall.defaultRulerColor');
    }
  },

};
