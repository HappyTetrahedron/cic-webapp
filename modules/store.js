import * as Api from "./api.js"
import * as Config from "../configuration.js"
import {reactive} from "https://unpkg.com/petite-vue@0.3.0/dist/petite-vue.es.js"

export const store = reactive({
    shipOptionsAvailable: {},
    shipOptionsChosen: {},

    systemsAvailable: [],

    scriptsAvailable: [],

    systemsSelected: [],

    scriptsSelected: [],

    ships: [
        "ship1",
        "ship2",
        "ship3",
        "ship4",
        "ship5",
        "ship6",
        "ship7",
        "ship8",
    ],


    // UI state:
    currentTabIdx: 0,
    currentShip: "ship1",

    onSystemClicked(systemName) {
        if (this.systemsSelected.includes(systemName)) {
            const idx = this.systemsSelected.indexOf(systemName);
            this.systemsSelected.splice(idx, 1);
        }
        else {
            this.systemsSelected.push(systemName);
        }
        this.store("systems", this.systemsSelected);
    },

    onScriptClicked(systemName) {
        if (this.scriptsSelected.includes(systemName)) {
            const idx = this.scriptsSelected.indexOf(systemName);
            this.scriptsSelected.splice(idx, 1);
        }
        else {
            this.scriptsSelected.push(systemName);
        }
        this.store("scripts", this.scriptsSelected);
    },

    onSelectOptClicked(optionName) {
        this.shipOptionsChosen[this.currentTab][this.currentShip] = optionName;
        this.store("opts", this.shipOptionsChosen);
    },

    onMultiSelectOptClicked(optionName) {
        const index = this.shipOptionsChosen[this.currentTab][this.currentShip].indexOf(optionName)
        if (index > -1) {
            this.shipOptionsChosen[this.currentTab][this.currentShip].splice(index, 1);
        }
        else {
            this.shipOptionsChosen[this.currentTab][this.currentShip].push(optionName);
        }
        this.store("opts", this.shipOptionsChosen);
    },

    onPropertyChanged(optionName) {
        this.store("opts", this.shipOptionsChosen);
    },

    onResetSystemsButtonClicked() {
        this.systemsSelected = [];
        this.scriptsSelected = [];
        this.storeAll();
    },

    onResetShipConfigButtonClicked() {
        delete this.shipOptionsChosen[this.currentTab][this.currentShip];
        this.setAvailableShipConfigOptions(this.shipOptionsAvailable);
        this.storeAll();
    },

    onResetAllShipConfigButtonClicked() {
        this.shipOptionsChosen = {};
        this.setAvailableShipConfigOptions(this.shipOptionsAvailable);
        this.storeAll();
    },

    onResetAllButtonClicked() {
        this.systemsSelected = [];
        this.scriptsSelected = [];
        this.shipOptionsChosen = {};
        this.setAvailableShipConfigOptions(this.shipOptionsAvailable);
        this.storeAll();
    },

    async onGenerateButtonClicked() {
        await Api.downloadXML(this.generateDataDict());
    },


    selectTab(tabName) {
        const tabIdx = Object.keys(this.shipOptionsAvailable).indexOf(tabName);
        this.currentTabIdx = tabIdx;
    },

    selectShip(shipName) {
        this.currentShip = shipName;
    },

    get currentTab() {
        return Object.keys(this.shipOptionsAvailable)[this.currentTabIdx];
    },

    get currentOptionsAvailable() {
        return this.shipOptionsAvailable[this.currentTab]?.options;
    },

    get currentOptionsType() {
        return this.shipOptionsAvailable[this.currentTab]?.type;
    },

    get currentOptionsSelected() {
        return this.shipOptionsChosen[this.currentTab]?.[this.currentShip];
    },

    get minX() {
        return Math.min(...this.systemsAvailable.map(item => parseInt(item.x)))
    },

    get minY() {
        return Math.min(...this.systemsAvailable.map(item => parseInt(item.y)))
    },

    getStelCartLinkFor(systemName) {
        return `${Config.STEL_CART_URI}?sector=${systemName}`
    },

    setAvailableScripts(scripts) {
        this.scriptsAvailable = scripts;
    },

    setAvailableSystems(scripts) {
        this.systemsAvailable = scripts;
    },

    setSelectedShipConfigOptions(opts) {
        this.shipOptionsChosen = opts;
    },
    setSelectedSystems(opts) {
        this.systemsSelected = opts;
    },
    setSelectedScripts(opts) {
        this.scriptsSelected = opts;
    },

    storeAll() {
        this.store("opts", this.shipOptionsChosen);
        this.store("systems", this.systemsSelected);
        this.store("scripts", this.scriptsSelected);
    },

    setVersion(version) {
        this.version = version;
    },

    setAvailableShipConfigOptions(scripts) {
        this.shipOptionsAvailable = scripts;

        for (const [k, v] of Object.entries(scripts)) {

            if (!this.shipOptionsChosen[k]) {
                this.shipOptionsChosen[k] = {};
            }
            for (const ship of this.ships) {
                if ((v.type) == "select") {
                    if (!this.shipOptionsChosen[k][ship]) {
                        this.shipOptionsChosen[k][ship] = "None";
                    }
                }
                if ((v.type) == "multi-select") {
                    if (!this.shipOptionsChosen[k][ship]) {
                        this.shipOptionsChosen[k][ship] = [];
                    }
                }
                if ((v.type) == "property-dict") {
                    if (!this.shipOptionsChosen[k][ship]) {
                        this.shipOptionsChosen[k][ship] = {};
                    }
                    for (const prop of v.options) {
                        if (this.shipOptionsChosen[k][ship][prop.name] === undefined) {
                            this.shipOptionsChosen[k][ship][prop.name] = -1;
                        }
                    }
                }
            }
        }
    },

    generateDataDict() {
        const dict = {
            "systems": this.systemsSelected,
            "scripts": this.scriptsSelected,
        }

        for (const [opt, optv] of Object.entries(this.shipOptionsChosen)) {
            for (const [ship, shipv] of Object.entries(optv)) {
                if (this.shipOptionsAvailable[opt].type == "select") {
                    if (shipv != "None") {
                        this.ensureKeyAndSet(dict, [opt, ship], shipv);
                    }
                }
                if (this.shipOptionsAvailable[opt].type == "multi-select") {
                    if (shipv != []) {
                        this.ensureKeyAndSet(dict, [opt, ship], shipv);
                    }
                }
                if (this.shipOptionsAvailable[opt].type == "property-dict") {
                    for (const [prop, propv] of Object.entries(shipv)) {
                        if (propv != -1) {
                            this.ensureKeyAndSet(dict, [opt, ship, prop], propv);
                        }
                    }
                }
            }
        }

        console.log(dict);
        return dict;
    },

    ensureKeyAndSet(dict, dictPath, value) {
        if (dictPath.length < 1) {
            return;
        }
        if (dictPath.length == 1) {
            dict[dictPath[0]] = value;
            return;
        }
        if (!Object.keys(dict).includes(dictPath[0])) {
            dict[dictPath[0]] = {}
        }
        this.ensureKeyAndSet(dict[dictPath[0]], dictPath.slice(1), value)
    },

    load(key) {
        var data = window.localStorage.getItem(key);
        if (!!data) {
            return JSON.parse(data);
        }
    },

    store(key, val) {
        window.localStorage.setItem(key, JSON.stringify(val))
    },

    async init() {
        const opts = this.load("opts");
        if (!!opts) this.setSelectedShipConfigOptions(opts);
        const scripts = this.load("scripts");
        if (!!scripts) this.setSelectedScripts(scripts);
        const systems = this.load("systems");
        if (!!systems) this.setSelectedSystems(systems);
        await Promise.all([
            Api.fetchVersion()
            .then(l => this.setVersion(l)),
            Api.fetchAvailableSystems()
            .then(l => this.setAvailableSystems(l)),
            Api.fetchAvailableScripts()
            .then(l => this.setAvailableScripts(l)),
            Api.fetchShipConfigOptions()
            .then(l => this.setAvailableShipConfigOptions(l)),
        ])
    }
})
