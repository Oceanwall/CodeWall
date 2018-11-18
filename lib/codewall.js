'use babel';

import { CompositeDisposable } from 'atom';

//TODO
// Automatically change line color to red if over line length, on any change
// Offer option to change line color
// Offer option to change line length
// Testing in spec?
// Changelog, package.json, ReadME

export default {

  subscriptions: null,

  activate() {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Turn on CodeWall
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'codewall:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  toggle() {
    let editor;
    if (editor = atom.workspace.getActiveTextEditor()) {
      editor.insertText(String(editor.preferredLineLength));
    }
  }

};
