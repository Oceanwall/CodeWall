'use babel';

import { CompositeDisposable, Point, Range } from 'atom';

//TODO
// Automatically change line color to red if over line length, on any change
// Offer option to change line color (default, over line)
// Offer option to change line length
// Testing in spec?
// Changelog, package.json, ReadME
// highlight which text went over? (markbufferposition)

export default {

  subscriptions: null,
  defaultColor: document.getElementsByClassName("wrap-guide")[0].style.backgroundColor,
  errorColor: "red",

  activate() {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Turn on CodeWall
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'codewall:toggle': () => this.toggle()
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

  toggle() {
    atom.workspace.observeActiveTextEditor((editor) => {
      let numLines = editor.getLineCount();
      let maxLineLength = editor.preferredLineLength;

      let violations = [];
      let isOver = false;

      for (let i = 0; i < numLines; i++) {
        let currentLineLength = editor.lineTextForBufferRow(i).length;
        if (currentLineLength > maxLineLength) {
          isOver = true;
          let violation = new Range(new Point(i, 80), new Point(i, currentLineLength));
          violations.push(violation);
        }
      }

      if (isOver) {
        document.getElementsByClassName("wrap-guide")[0].style.backgroundColor = this.errorColor;
        for (let violation of violations) {
          // TODO: Change this to "never"
          editor.markBufferRange(violation, null);
        }
      }
      else {
        document.getElementsByClassName("wrap-guide")[0].style.backgroundColor = this.defaultColor;
      }
    });
  }

};
