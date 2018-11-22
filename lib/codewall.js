'use babel';

import { CompositeDisposable, Point } from 'atom';

//TODO
// Automatically change line color to red if over line length, on any change
// Offer option to change line color (default, over line)
// Offer option to change line length
// Testing in spec?
// Changelog, package.json, ReadME
// highlight which text went over? (markbufferposition)
// codewall.json, spec? (still references toggle)
//TODO: Check if something already active (Like the selector) and stop activation?
// move active out of class?
// removes git change markings?


export default {

  subscriptions: null,
  codewallActives: null,

  // Check configuration information for error colors of ruler / line highlight
  defaultColor: document.getElementsByClassName("wrap-guide")[0].style.backgroundColor,
  // Set to defaults, dealing with weird inconsistency bugs
  highlightErrorColor: 'rgba(255, 0, 0, 0.3)',

  activate() {
    this.highlightErrorColor = atom.config.get('codewall.highlightErrorColor');

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
        // Hacky fix: Update EVERY SINGLE WRAP GUIDE on EVERY ACTIVE TEXT EDITOR every time
        // Question: How to distinguish wrap guide? Use map, text editor : guide?
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
        console.log(this.defaultColor);
      }
    }));
  },

  turnOff() {
    this.active = false;
    atom.workspace.observeTextEditors((editor) => {
      for (let marker of editor.getMarkers()) {
        marker.destroy();
      }

      for (let ruler of document.getElementsByClassName("wrap-guide")) {
        ruler.style.backgroundColor = this.defaultColor;
      }
    });

    this.codewallActives.dispose();
  },

  openPackageSettings() {
    atom.workspace.open("atom://config/packages/codewall");
  },

  rulerColorChange(event) {
    let newColor = event.newValue.toRGBAString();
    atom.config.set('codewall.rulerErrorColor', newColor);

    for (let ruler of document.getElementsByClassName("wrap-guide")) {
      ruler.style.backgroundColor = atom.config.get('codewall.rulerErrorColor');
    }
  },

  highlightColorChange(event) {
    console.log(document.styleSheets[i].cssRules);
  }

};
