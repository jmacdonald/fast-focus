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

const { Shell } = imports.gi;
const WindowManager = imports.ui.main.wm;

class Extension {
    constructor() {
      log('constructing fast focus extension');

      this.appSystem = Shell.AppSystem.get_default();
    }

    enable() {
      WindowManager.setCustomKeybindingHandler(
        'log-running-apps',
        Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
        this.logRunningApps.bind(this)
      );
    }

    disable() {
    }

    logRunningApps() {
      for (const app of this.appSystem.get_running()) {
        log(`found ${app.get_name()} running`);
      }
    }
}

function init() {
    return new Extension();
}
