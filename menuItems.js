/* Panel Indicators GNOME Shell extension
 *
 * Copyright (C) 2019 Leandro Vital <leavitals@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const Lang = imports.lang;
var MenuItems = new Lang.Class({
    Name: "MenuItems",
    _init: function (settings) {
        this.settings = settings;
    },
    getItems: function () {
        let itemsString = this.settings.get_string("items");
        return JSON.parse(itemsString);
    },
    addItem: function() {
        let items = this.getItems();
        let item = { id: this.uuid(), app: '', window_instance: '', title: '', binding: '', type: 'Scratchpad' };
        items.push(item);
        this.setItems(items);
        return item;
    },
    deleteItem: function(item) {
        let items = this.getItems();
        items = items.filter(i => i.id !== item.id);
        this.setItems(items);
    },
    uuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    changeOrder: function (index, posRel) {
        let items = this.getItems();
        if ((posRel < 0 && index > 0) || (posRel > 0 && index < (items.length - 1))) {
            let temp = items[index];
            items.splice(index, 1);
            items.splice(parseInt(index) + posRel, 0, temp);
            this.setItems(items);
            return true;
        }
        return false;
    },
    changeEnable: function (index, value) {
        let items = this.getItems();
        if (index < 0 && index >= items.length) {
            return false;
        }
        items[index]["enable"] = value;
        this.setItems(items);
        return true;
    },
    changePosition: function (index, value) {
        let items = this.getItems();
        if (index < 0 && index >= items.length) {
            return false;
        }
        items[index]["position"] = value;
        this.setItems(items);
        return true;
    },
    setItems: function (items) {
        let itemsString = JSON.stringify(items);
        this.settings.set_string("items", itemsString);
    },
    itemsToString: function (itemsArray) {
        let items = new Array()
        for (let indexItem in itemsArray) {
            let itemDatasArray = itemsArray[indexItem];
            let itemDatasString = itemDatasArray["label"] + ";" + (itemDatasArray["enable"] ? "1" : "0") + ";" + (itemDatasArray["position"] ? "1" : "0") + ";" + itemDatasArray["shortcut"];
            items.push(itemDatasString);
        }
        return items.join("|");
    },
    getEnableItems: function () {
        let items = this.getItems();
        let indexItem;
        let itemsEnable = new Array();
        for (indexItem in items) {
            let item = items[indexItem];
            if (item["enable"]) {
                itemsEnable.push(item["shortcut"]);
            }
        }
        return itemsEnable;
    },
    getCenterItems: function () {
        let items = this.getItems();
        let indexItem;
        let itemsEnable = new Array();
        for (indexItem in items) {
            let item = items[indexItem];
            if (item["enable"] && item["position"]) {
                itemsEnable.push(item["shortcut"]);
            }
        }
        return itemsEnable;
    }
});