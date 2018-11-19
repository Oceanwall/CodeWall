'use babel';

import { CompositeDisposable, Point, Range } from 'atom';

//TODO
// Automatically change line color to red if over line length, on any change
// Offer option to change line color (default, over line)
// Offer option to change line length
// Testing in spec?
// Changelog, package.json, ReadME
// highlight which text went over? (markbufferposition)
// codewall.json, spec? (still references toggle)

export default {

  subscriptions: null,
  codewallActives: null,
  defaultColor: document.getElementsByClassName("wrap-guide")[0].style.backgroundColor,
  errorColor: "red",

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

    // on any change made by the active text editor
    // current problem: loops and suicides
    // atom.workspace.observeActiveTextEditor((editor) => {
    //   // TODO: Save preferredLineLength, or get each time?
    //   editor.onDidChange(() => {
    //     let numLines = editor.getLineCount();
    //     let maxLineLength = editor.preferredLineLength;
    //
    //     let violations = [];
    //     let isOver = false;
    //
    //     for (let i = 0; i < numLines; i++) {
    //       if (editor.lineTextForBufferRow(i).length > maxLineLength) {
    //         isOver = true;
    //         violations.push(i);
    //       }
    //     }
    //
    //     if (isOver) {
    //       editor.insertText("violated");
    //       console.log("working, i think?")
    //       document.getElementsByClassName(".wrap-guide")[0].style.backgroundColor = "red";
    //     }
    //
    //
    //   });
    // });
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
          ruler.style.backgroundColor = this.errorColor;
        }

        for (let violation of violations) {
          let marker = editor.markBufferPosition(violation, "never");
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
    atom.workspace.observeTextEditors((editor) => {
      for (let marker of editor.getMarkers()) {
        marker.destroy();
      }

      for (let ruler of document.getElementsByClassName("wrap-guide")) {
        ruler.style.backgroundColor = this.defaultColor;
      }
    });

    this.codewallActives.dispose();
  }

};
