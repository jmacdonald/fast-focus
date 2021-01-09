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
        if (mapping.app) {
          this.activateApp(mapping.app);
        } else {
          const win = this.findWindow(mapping.window_instance);

          if (win !== undefined) { this.showWindow(win); }
        }
      });
    }
    for (const mapping of SCRATCHPAD_APP_MAPPINGS) {
      this.keyBinder.listenFor(mapping.binding, () => {
        this.toggleWindow(mapping.window_instance);
      });
    }
    this.keyBinder.listenFor(HIDE_SCRATCHPAD_APP_BINDING, () => {
      this.hideScratchpadWindows();
    });
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
    let win = this.findWindow(name);

    if (win === undefined) { return; }

    if (win.has_focus()) {
      this.hideWindow(win);
    } else {
      this.centerWindow(win);
      this.showWindow(win);
    }
  }

  hideScratchpadWindows() {
    let scratchpadClasses =
      SCRATCHPAD_APP_MAPPINGS.map(mapping => mapping.window_instance);

    for (const app of this.appSystem.get_running()) {
      for (const win of app.get_windows()) {
        if (scratchpadClasses.includes(win.get_wm_class_instance())) {
          this.hideWindow(win);
        }
      }
    }
  }

  findWindow(name) {
    let windows = [];
    this.appSystem.get_running().map(app => windows.push(...app.get_windows()));

    const win = windows.find(win => {
      return win.get_title() === name || win.get_wm_class_instance() === name
    });

    if (win === undefined) {
      log(`Couldn't locate "${name}" window`);
      log(`Found these other windows:`);
      this.logWindows();
    }

    return win;
  }

  logWindows() {
    for (const app of this.appSystem.get_running()) {
      for (const win of app.get_windows()) {
        log(`=========================`);
        log(`title: "${win.get_title()}"`);
        log(`class instance: "${win.get_wm_class_instance()}"`);
      }
    }
  }

  centerWindow(win) {
    // Get the dimensions of the window.
    const { width: windowWidth, height: windowHeight } = win.get_frame_rect();

    // Get the dimensions of the primary display and its position
    // relative to the workspace (which includes all monitors).
    const workspace = global.workspace_manager.get_active_workspace();
    const display = workspace.get_display();
    const primaryMonitorIndex = display.get_primary_monitor();
    const {
      width: monitorWidth,
      height: monitorHeight
    } = workspace.get_work_area_for_monitor(primaryMonitorIndex);
    const {
      x: monitorX,
      y: monitorY
    } = display.get_monitor_geometry(primaryMonitorIndex);

    // Establish the coordinates required to center the window on the
    // primary monitor, accounting for its position in the workspace.
    const x = monitorWidth / 2 - windowWidth / 2 + monitorX;
    const y = monitorHeight / 2 - windowHeight / 2 + monitorY;

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
