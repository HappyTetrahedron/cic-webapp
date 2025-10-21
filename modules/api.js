import * as Config from "../configuration.js"

export async function fetchVersion() {
    let res = await fetch(Config.API_URI + "version");
    return await res.text();
}

export async function fetchShipConfigOptions() {
    let list = await fetchJson(Config.API_URI + "ship_configs");
    return list;
}

export async function fetchAvailableSystems() {
    let list = await fetchJson(Config.API_URI + "systems");
    return list;
}

export async function fetchAvailableScripts() {
    let list = await fetchJson(Config.API_URI + "extensions");
    return list;
}

export async function downloadXML(data) {
    let res = await fetch(Config.API_URI + "render", {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
    })

    let body = await res.text();
    let blob = new Blob([body], { type: 'application/octet-stream'});
    const url = URL.createObjectURL(blob);

    var link = document.createElement("a");
    link.download = "MISS_TSN-Command.xml";
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function fetchJson(url) {
    let res = await fetch(url);
    return await res.json()
}
