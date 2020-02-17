import Log from "../Util";
import * as JSZip from "jszip";
import * as parse5 from "parse5";
import Room from "./Room";
import * as fs from "fs";

export default class RoomsDatasetHelper {

    private rooms: any[];
    private content: string;

    constructor() {
        this.rooms = [];
    }

    public parseRoomsZip(fileName: string): Promise<any> {
        Log.trace("got to parseRoomsZip");
        const jsZip = new JSZip();
        return new Promise<any>((resolve, reject) => {
            try {
                jsZip.loadAsync(this.content, {base64: true})
                    .then((zip: JSZip) => {
                        zip
                            .file(fileName)
                            .async("text")
                            .then((indexhtmAsString: string) => {
                                resolve(parse5.parse(indexhtmAsString));
                            });
                    });
            } catch (err) {
                Log.trace("parseRoomsZip rejected with err " + err);
                reject(err);
            }
        });
    }

    public findRooms(indexhtm: any) {
        let body: any;
        let html: any;
        for (let elem of indexhtm["childNodes"]) {
            if (elem["nodeName"] === "html") {
                html = elem;
                break;
            }
        }
        for (let elem of html["childNodes"]) {
            if (elem["nodeName"] === "body") {
                body = elem;
                break;
            }
        }
        this.divSearcher(body);
    }

    private divSearcher(parent: any) {
        for (let node of parent["childNodes"]) {
            if (node["nodeName"] === "div" || node["nodeName"] === "section") {
                this.divSearcher(node);
            } else if (node["nodeName"] === "table") {
                this.tableSearcher(node);
            }
        }
    }

    private tableSearcher(parent: any) {
        let tbody: any;
        for (let node of parent["childNodes"]) {
            if (node["nodeName"] === "tbody") {
                tbody = node;
                break;
            }
        }
        for (let node of tbody["childNodes"]) {
            if (node["nodeName"] === "tr") {
                this.buildingBuilder(node);
            }
        }
    }

    private buildingBuilder(node: any) {
        let room: Room = new Room();
        this.trSearcher(node, room);
        Log.trace("found a building in index.htm, got its shortname, fullname, and address");
        if (room.href !== null) {
            this.parseRoomsZip(room.href)
                .then((result: any) => {
                    // parse the stuff in an individual building folder
                });
        }
    }

    private trSearcher(node: any, room: Room) {
        if (node["nodeName"] === "tr") {
            for (let child of node["childNodes"]) {
                this.tdSearcher(child, room);
            }
        }
    }

    private tdSearcher(node: any, room: Room) {
        if (node["nodeName"] === "td") {
            for (let child of node["attrs"]) {
                if (child["value"] === "views-field views-field-nothing") {
                    room.href = this.aSearcher(node["childNodes"]);
                } else if (child["value"] === "views-field views-field-field-building-code") {
                    room.shortname = node["childNodes"][0]["value"].trim();
                    // assuming the shortname will always be the first (and only) index in childNodes, might be faulty
                } else if (child["value"] === "views-field views-field-field-building-address") {
                    room.address = node["childNodes"][0]["value"].trim();
                }
            }
        }
    }

    private aSearcher(node: any) {
        for (let child of node) {
            if (child["nodeName"] === "a") {
                for (let grandchild of child["attrs"]) {
                    if (grandchild["name"] === "href") {
                        return grandchild["value"];
                    }
                }
            }
        }
    }

    public getAllRoomsMasterMethod(content: string) {
        this.content = content;
        return this.parseRoomsZip("rooms/index.htm")
            .then((indexhtm: any) => {
                Log.trace("parsed index.htm into a JSON object");
                this.findRooms(indexhtm);
            })
            .then((result: any) => {
                return this.rooms;
            });
    }
}
