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
  { app: 'Firefox', binding: '<super>h' }
];

const SCRATCHPAD_APP_MAPPINGS = [
  { window_instance: 'slack', binding: '<super>i' },
  { window_instance: 'devdocs.io', binding: '<super>m' },
  { window_instance: 'calendar.google.com', binding: '<super>c' },
  { window_instance: 'todoist.com', binding: '<super>t' }
];

const HIDE_SCRATCHPAD_APP_BINDING = '<super>n';

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
        this.activateApp(mapping);
      });
    }
    for (const mapping of SCRATCHPAD_APP_MAPPINGS) {
      this.keyBinder.listenFor(mapping.binding, () => {
        this.toggleWindow(mapping);
      });
    }
    this.keyBinder.listenFor(HIDE_SCRATCHPAD_APP_BINDING, () => {
      this.hideScratchpadWindows();
    });
  }

  disable() {
    this.keyBinder.clearBindings();
  }

  activateApp(mapping) {
    const windowObject = this.findWindowObject(mapping);

    if (windowObject === undefined) {
      log(`Couldn't locate window with matching definition.`);
    } else {
      this.showWindow(windowObject.window);
    }
  }

  toggleWindow(mapping) {
    const windowObject = this.findWindowObject(mapping);

    if (windowObject === undefined) {
      log(`Couldn't locate window with matching definition.`);
    } else {
      if (windowObject.window.has_focus()) {
        this.hideWindow(windowObject.window);
    } else {
      this.centerWindow(windowObject.window);
        this.showWindow(windowObject.window);
      }
    }
  }

  hideScratchpadWindows() {
    for(const mapping of SCRATCHPAD_APP_MAPPINGS) {
      const windowObject = this.findWindowObject(mapping);
      this.hideWindow(windowObject.window);
    }
  }

  findWindowObject(definition) {
    const windows = [];
    for (const app of this.appSystem.get_running()) {
      for (const win of app.get_windows()) {
        windows.push({app: app, window: win});
      }
    }
    const matchingWindows = windows.filter((windowObject) => {
      if(!this.matchValue(definition.window_instance, windowObject.window.get_wm_class_instance())) {return false; }
      if(!this.matchValue(definition.title, windowObject.window.get_title())) {return false; }
      if(!this.matchValue(definition.app, windowObject.app.get_name())) {return false; }
      return true;
    });
    if(matchingWindows.length > 0) {
      return matchingWindows[0];
    }
  }

  matchValue(regexExpression, windowComponent) {
    if (!regexExpression || regexExpression === '') {
      return true;
    }
    const regex = new RegExp(regexExpression);
    return regex.test(windowComponent);
  }

  centerWindow(win) {
    // Get window and screen dimensions for the primary monitor.
    const workspace = global.workspace_manager.get_active_workspace();
    const {width: windowWidth, height: windowHeight} = win.get_frame_rect();
    const {width: screenWidth, height: screenHeight} = workspace.get_work_area_for_monitor(0);

    // Establish the coordinates required to center the window.
    const x = screenWidth / 2 - windowWidth / 2;
    const y = screenHeight / 2 - windowHeight / 2;

    // Center the window, specifying this as a user-driven operation.
    win.move_frame(true, x, y);
  }

  showWindow(win) {
    win.change_workspace_by_index(
      global.workspace_manager.get_active_workspace_index(),
      false
    );
    win.unminimize();
    win.raise();
    win.focus(0);
  }

  hideWindow(win) {
    win.minimize();
  }
}

function init() {
  return new Extension();
}
