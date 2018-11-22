'use babel';

import { CompositeDisposable, Point } from 'atom';

//TODO
// Offer option to change highlight line color
// Offer option to change line length to trigger ruler
// Testing in spec?
// Changelog, package.json, ReadME
// codewall.json, spec? (still references toggle)
// move currentlyActive out of class?
// removes git change markings? fix?

// CURRENT TODO: Shift from activting on "turn on" to activating automatically


export default {

  subscriptions: null,
  codewallActives: null,
  currentlyActive: null,
  defaultColor: null,

  activate() {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.codewallActives = new CompositeDisposable();

    // Create links between package commands and code
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'codewall:turn-on': () => this.turnOn()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'codewall:turn-off': () => this.turnOff()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'codewall:change-colors': () => this.openPackageSettings()
    }));

    this.subscriptions.add(atom.config.onDidChange('codewall.rulerErrorColor', this.rulerColorChange));
    this.subscriptions.add(atom.config.onDidChange('codewall.highlightErrorColor', this.highlightColorChange));

  },

  config: {
    "rulerErrorColor": {
      "description": "Change the ruler's error color here.",
      "type": "color",
      "default": "rgba(255, 0, 0, 1)"
    },
    "highlightErrorColor": {
      "description": "Change the line highlight's error color here.",
      "type": "color",
      "default": "rgba(255, 0, 0, 0.3)"
    }
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  turnOn() {
    this.defaultColor = document.getElementsByClassName("wrap-guide")[0].style.backgroundColor;
    this.currentlyActive = true;
    console.log("1");

    this.codewallActives.add(atom.workspace.observeActiveTextEditor((editor) => {
      // If no active editor...
      if (!editor) {
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
          ruler.style.backgroundColor = this.defaultColor;
        }
      }
    }));
  },

  turnOff() {
    this.currentlyActive = false;
    for (let editor of atom.textEditors.editors) {
      for (let marker of editor.getMarkers()) {
        marker.destroy();
      }

      for (let ruler of document.getElementsByClassName("wrap-guide")) {
        ruler.style.backgroundColor = this.defaultColor;
      }
    }

    //
    // atom.workspace.observeTextEditors((editor) => {
    //   for (let marker of editor.getMarkers()) {
    //     marker.destroy();
    //   }
    //
    //   for (let ruler of document.getElementsByClassName("wrap-guide")) {
    //     ruler.style.backgroundColor = this.defaultColor;
    //   }
    // });

    this.codewallActives.dispose();
    this.currentlyActive = false;
  },

  openPackageSettings() {
    atom.workspace.open("atom://config/packages/codewall");
  },

  rulerColorChange(event) {
    atom.config.set('codewall.rulerErrorColor', event.newValue.toRGBAString());

    for (let ruler of document.getElementsByClassName("wrap-guide")) {
      if (this.currentlyActive)
        ruler.style.backgroundColor = atom.config.get('codewall.rulerErrorColor');
      console.log(this.currentlyActive);
    }
  },

  highlightColorChange(event) {
    console.log(document.styleSheets[i].cssRules);
    // TODO: Work with atom.config.get('codewall.highlightErrorColor');
  }

};
