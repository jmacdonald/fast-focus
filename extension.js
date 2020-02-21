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

const MAPPINGS = {
  'Terminal': '<super>return',
  'Firefox' : '<super>h',
  'Slack'   : '<super>i'
};

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
    for (const appName in MAPPINGS) {
      this.keyBinder.listenFor(MAPPINGS[appName], () => {
        this.activateApp(appName);
      });
    }
  }

  disable() {
    this.keyBinder.clearBindings();
  }

  activateApp(name) {
    const app = this.appSystem.get_running().find(app => app.get_name() === name);

    if (app === undefined) {
      log(`Couldn't locate "${name}" app`);
    } else {
      app.activate();
    }
  }
}

function init() {
  return new Extension();
}
