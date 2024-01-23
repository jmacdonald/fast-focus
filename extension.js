import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import Shell from 'gi://Shell';
import KeyBinder from './keybinder.js';

const MAPPINGS = [
  { app: 'Console', binding: '<super>return' },
  { app: 'Firefox', binding: '<super>h' },
  { app: 'Zoom', binding: '<super>z' }
];

const SCRATCHPAD_APP_MAPPINGS = [
  { window_instance: 'discord', binding: '<super>g' },
  { window_instance: 'Slack', binding: '<super>i' },
  { window_instance: 'chrome-devdocs.io', binding: '<super>m' },
  { window_instance: 'chrome-calendar.google.com', binding: '<super>c' },
  { window_instance: 'chrome-todoist.com', binding: '<super>t' }
];

const HIDE_SCRATCHPAD_APP_BINDING = '<super>n';
const SCRATCHPAD_WIDTH  = 1500;
const SCRATCHPAD_HEIGHT = 1000;

export default class FastFocusExtension extends Extension {
  enable() {
    this.appSystem = Shell.AppSystem.get_default();
    this.keyBinder = new KeyBinder();

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
      this.resizeWindow(win);
      this.centerWindow(win);
      this.showWindow(win);
    }
  }

  hideScratchpadWindows() {
    let scratchpadClasses =
      SCRATCHPAD_APP_MAPPINGS.map(mapping => mapping.window_instance);

    for (const app of this.appSystem.get_running()) {
      for (const win of app.get_windows()) {
        if (
          scratchpadClasses.includes(win.get_title()) ||
          scratchpadClasses.find(klass => win.get_wm_class_instance().startsWith(klass))
        ) {
          this.hideWindow(win);
        }
      }
    }
  }

  findWindow(name) {
    let windows = [];
    this.appSystem.get_running().map(app => windows.push(...app.get_windows()));

    const win = windows.find(win => {
      return win.get_title() === name || win.get_wm_class_instance().startsWith(name)
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

  resizeWindow(win) {
    const { x: x, y: y } = win.get_frame_rect();
    win.move_resize_frame(true, x, y, SCRATCHPAD_WIDTH, SCRATCHPAD_HEIGHT);
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
