"use babel";

import { homedir } from "os";
import path from "path";
import fs from "fs";
import { CompositeDisposable } from "atom";
import { toPng } from "dom-to-image";

const DEFAULT_DIR = path.join(homedir(), "Downloads");

function dev(fn) {
  return function(...args) {
    return atom.inDevMode() && fn(...args);
  };
}

const log = dev(console.log);

export default {
  subscriptions: null,

  config: {
    save_location: {
      title: "Path",
      description: "The place you want to save all your snapshots to.",
      default: DEFAULT_DIR,
      type: "string"
    }
  },

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "code-snapshot:snapshot": () => this.snapshot()
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  snapshot() {
    log("CodeSnapshot was toggled!");

    let view;
    let editor;
    let changed;

    (changed = (view = atom.views.getView(
      (editor = atom.workspace.getActiveTextEditor())
    )).querySelectorAll("[class*=syntax--]")).forEach(el => {
      if (el.children.length !== el.childNodes.length) {
        const c = window.getComputedStyle(el).getPropertyValue("color");

        c !== window.getComputedStyle(view).getPropertyValue("color") &&
          (el.style.backgroundColor = c);
      }
    });

    const location = path.join(
      atom.config.get("code-snapshot.save_location"),
      `${editor.getLongTitle()}_${Date.now()}.png`
    );

    console.log(
      window.getComputedStyle(view).getPropertyValue("background-color")
    );

    const lines = view.getElementsByClassName("lines")[0];

    toPng(lines, {
      bgcolor: window
        .getComputedStyle(view)
        .getPropertyValue("background-color"),
      height: lines.style.height.replace("px", ""),
      width: lines.style.width.replace("px", "")
    }).then(data => {
      fs.writeFile(
        location,
        data.replace(/^data:image\/png;base64,/, ""),
        "base64",
        err => {
          if (err)
            return atom.notifications.addError(
              "🤕 There was a problem saving your snapshot.",
              { detail: err.message }
            );

          atom.notifications.addSuccess("🎉 Saved your snapshot!", {
            detail: `See it here: ${location}`
          });

          changed && changed.forEach(el => (el.style.backgroundColor = null));
        }
      );
    });
  }
};
