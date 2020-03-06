/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const MAPPINGS = [
  { app: 'Terminal', binding: '<super>return' },
  { app: 'Firefox', binding: '<super>h' },
  { app: 'Slack', binding: '<super>i' },
];

const SCRATCHPAD_APP_MAPPINGS = [
  { window_instance: 'devdocs.io', binding: '<super>m' },
  { window_instance: 'calendar.google.com', binding: '<super>c' }
];

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const KeyBinder = Me.imports.keybinder.KeyBinder;
const Shell = imports.gi.Shell;

class Extension {
  constructor() {
    log('constructing fast focus extension');

    this.appSystem = Shell.AppSystem.get_default();
    this.keyBinder = new KeyBinder();
  }

  enable() {
    for (const mapping of MAPPINGS) {
      this.keyBinder.listenFor(mapping.binding, () => {
        this.activateApp(mapping.app);
      });
    }
    for (const mapping of SCRATCHPAD_APP_MAPPINGS) {
      this.keyBinder.listenFor(mapping.binding, () => {
        this.toggleWindow(mapping.window_instance);
      });
    }
  }

  disable() {
    this.keyBinder.clearBindings();
  }

  activateApp(name) {
    const app = this.
      appSystem.
      get_running().
      find(app => app.get_name() === name);

    if (app === undefined) {
      log(`Couldn't locate "${name}" app`);
    } else {
      app.activate();
    }
  }

  toggleWindow(name) {
    let windows = [];
    this.appSystem.get_running().map(app => windows.push(...app.get_windows()));
    const win = windows.find(win => win.get_wm_class_instance() === name);

    if (win === undefined) {
      log(`Couldn't locate "${name}" window`);
    } else {
      if (win.has_focus()) {
        win.minimize();
      } else {
        win.change_workspace_by_index(
          global.workspace_manager.get_active_workspace_index(),
          false
        );
        win.unminimize();
        win.raise();
        win.focus(0);
      }
    }
  }
}

function init() {
  return new Extension();
}
