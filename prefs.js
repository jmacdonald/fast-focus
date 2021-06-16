const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gettext = imports.gettext.domain("fast-focus");
const _ = Gettext.gettext;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Lang = imports.lang;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const MenuItems = Extension.imports.menuItems;

function init() {
}

const NotebookPage = new GObject.Class({
    Name: "NotebookPage",
    GTypeName: "NotebookPage",
    Extends: Gtk.Box,

    _init: function (title) {
        this.parent({
            orientation: Gtk.Orientation.VERTICAL,
        });
        this.set_homogeneous(false);
	    this.set_spacing(20);
        this.title = new Gtk.Label({
            label: "<b>" + title + "</b>",
            use_markup: true,
            xalign: 0
        });
    }
});

var FrameBox = new Lang.Class({
    Name: "FrameBox",
    GTypeName: "FrameBox",
    Extends: Gtk.Frame,

    _init: function (label) {
        this._listBox = new Gtk.ListBox();
        this._listBox.set_selection_mode(Gtk.SelectionMode.NONE);
        this.parent({
            child: this._listBox
        });
        // label_yalign: 0.50;
        this.label = label;
    },
    add: function (boxRow) {
        this._listBox.append(boxRow);
    },
    remove: function (boxRow) {
        this._listBox.remove(boxRow);
    }
});

var FrameBoxRow = new Lang.Class({
    Name: "FrameBoxRow",
    GTypeName: "FrameBoxRow",
    Extends: Gtk.ListBoxRow,

    _init: function () {
        this._box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
        });
        this.parent({
            child: this._box
        });
    },

    add: function (widget) {
        this._box.append(widget);
    }
});

const PrefsWidget = new GObject.Class({
    Name: "Prefs.Widget",
    GTypeName: "PrefsWidget",
    Extends: Gtk.Box,

    _init: function () {
        this.parent({
            orientation: Gtk.Orientation.VERTICAL,
        });
        this.set_spacing(5);
        this.settings = Convenience.getSettings();
        this.menuItems = new MenuItems.MenuItems(this.settings);

        let notebook = new Gtk.Notebook();
        notebook.set_margin_start(6);
        notebook.set_margin_end(6);

        let bindingsPage = new BindingsPage(this.settings, this.menuItems);
        notebook.append_page(bindingsPage, bindingsPage.title);

        this.append(notebook);
    }
});

var BindingsPage = new Lang.Class({
    Name: "BindingsPage",
    Extends: NotebookPage,

    _init: function (settings, menuItems) {
        this.parent(_("Application Bindings"));
        this.settings = settings;
        this.menuItems = menuItems;

        this.bindingsFrame = new FrameBox("");
        this.buildList();
        this.append(this.bindingsFrame);
        this.addFooter();
    },
    addFooter: function() {
        this.footerFrame = new FrameBox("");

        let addAppRow = new FrameBoxRow();
        let addButton = new Gtk.Button({
            visible: true,
            label: _("+ Add Binding"),
            can_focus: true
        });
        addButton.connect("clicked", Lang.bind(this, this.newItem));

        addAppRow.add(addButton);
        this.footerFrame.add(addAppRow);

        this.append(this.footerFrame);
    },
    buildList: function () {

        //Reset from scratch
        this.remove(this.bindingsFrame);

        let items = this.menuItems.getItems();
        this.bindingsFrame = new FrameBox(_(""));
        this.append(this.bindingsFrame);

        this.indicatorsArray = new Array();
        this.statusArray = new Array();
        this.labelsArray = new Array();

        for (let indexItem in items) {
            let item = items[indexItem];
            this.addItem(item);
        }

    },
    newItem: function() {
        let items = this.menuItems.getItems();
        let item = this.menuItems.addItem(this.bindingsFrame);
        this.addItem(item);
    },
    addItem: function(item) {
        let indicatorRow = new FrameBoxRow();

        indicatorRow.add(this.addType(item));
        indicatorRow.add(this.addLabelAndTextbox('App Container', item, 'app'));
        indicatorRow.add(this.addLabelAndTextbox('window Instance', item, 'window_instance'));
        indicatorRow.add(this.addLabelAndTextbox('Title', item, 'title'));
        indicatorRow.add(this.addLabelAndTextbox('Binding', item, 'binding'));

        let deleteButton = new Gtk.Button({
            visible: true,
            label: _("X"),
            can_focus: true
        });
        deleteButton.connect("clicked", Lang.bind(this, this.deleteItem, item, indicatorRow));
        indicatorRow.add(deleteButton);


        this.bindingsFrame.add(indicatorRow);
    },
    deleteItem: function(object, item, indicatorRow) {
        this.menuItems.deleteItem(item, this.bindingsFrame);
        this.bindingsFrame.remove(indicatorRow);
    },
    addType: function(item) {
        let container = this.addLabelContainer('Type');
        let positionCombo = new Gtk.ComboBoxText({
            halign: Gtk.Align.END
        });
        positionCombo.append_text(_("Focus"));
        positionCombo.append_text(_("Scratchpad"));

        positionCombo.set_active(item.type);
        positionCombo.connect("changed", Lang.bind(this, this.changeType, item));
        container.append(positionCombo);
        return container;
    },
    addLabelAndTextbox: function (text, item, property) {
        let container = this.addLabelContainer(text);

        let textbox = new Gtk.Entry({
            halign: Gtk.Align.END
        });
        textbox.set_text(item[property]);
        textbox.connect("changed", Lang.bind(this, this.changeProperty, item, property));

        container.append(textbox);
        return container;
    },
    changeProperty: function(object, item, property) {
       this.menuItems.setItemProperty(item, property, object.get_text());
    },
    addLabelContainer: function(text) {
        let container = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            halign: Gtk.Align.END
        });

        let label = new Gtk.Label({
            label: "<b>" + text + "</b>",
            use_markup: true,
            xalign: 0
        });

        container.append(label);
        return container;
    },
    changeOrder: function (o, index, order) {
        this.menuItems.changeOrder(index, order);
        this.buildList();
    },
    changeEnable: function (object, p, index) {
        let items = this.menuItems.getItems();
        let item = items[index];

        if (_(item["label"]) == _("Calendar") &&
           !this.settings.get_boolean("separate-date-and-notification")) {
            object.set_active(false);
       }
       else
            this.menuItems.changeEnable(index, object.active);
    },
    changeType: function (object, index) {
        this.menuItems.changePosition(index, object.get_active());
        this.changeOrder(null, index, -index);
    },
    resetPosition: function () {
        this.settings.set_value("items", this.settings.get_default_value("items"));
        this.buildList();
    },
});

function buildPrefsWidget() {
    let widget = new PrefsWidget();
    widget.show();
    return widget;
}