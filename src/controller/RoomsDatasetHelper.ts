import Log from "../Util";
import * as JSZip from "jszip";
import * as parse5 from "parse5";
import Room from "./Room";
import * as http from "http";
import {IncomingMessage} from "http";

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
                        zip.file("rooms" + fileName)
                            .async("text")
                            .then((htmlAsString: string) => {
                                resolve(parse5.parse(htmlAsString));
                            });
                    });
            } catch (err) {
                Log.trace("parseRoomsZip rejected with err " + err);
                reject(err);
            }
        });
    }

    public findHTMLBody(indexhtm: any) {
        let body: any;
        let html: any;
        for (let child of indexhtm["childNodes"]) {
            if (child["nodeName"] === "html") {
                html = child;
                break;
            }
        }
        for (let child of html["childNodes"]) {
            if (child["nodeName"] === "body") {
                return child;
            }
        }
        Log.trace("this HTML has no body");
    }

    private buildingLevelRecursion(parent: any) {
        for (let node of parent["childNodes"]) {
            if (node["nodeName"] === "div" || node["nodeName"] === "section") {
                this.buildingLevelRecursion(node);
            } else if (node["nodeName"] === "table") {
                this.buildingLevelTableSearch(node);
            }
        }
    }

    private buildingLevelTableSearch(parent: any) {
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
        if (room.address !== null) {
            this.getLatLon(room);
            // if this thing is invalid it's gonna throw an error, should just let that ride all the way back up to top
            // and return insight error from there
            // todo: this thing should be wrapped in a promise, it's async
        }
        if (room.href !== null) {
            this.parseRoomsZip(room.href.substring(1))
                .then((roomHTML: any) => {
                    this.roomBuilder(roomHTML, room);
                });
        }
    }

    private getLatLon(room: Room) {
        let encoded: string = encodeURI(room.address);
        let url: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team097/" + encoded;
        http.get(url, (res: IncomingMessage) => {
            // callback function taken from https://nodejs.org/api/http.html#http_http_get_options_callback
            res.setEncoding("utf8");
            let rawData: any = "";
            res.on("data", (chunk) => {
                rawData += chunk;
            });
            res.on("end", () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    if (parsedData["error"] !== undefined) {
                        throw new Error("the lat/lon request resulted in an error");
                    }
                    room.lat = parsedData["lat"];
                    room.lon = parsedData["lon"];
                } catch (e) {
                    Log.error(e.message);
                }
            });
        }).on("error", (e) => {
            Log.error(`Got error: ${e.message}`);
        });
    }

    private roomBuilder(node: any, room: Room) {
        let tbody: any = this.findHTMLBody(node);
        this.roomLevelRecursion(tbody, room);
        Log.trace("room has been filled at this point, is ready to be pushed to rooms provided it's not empty");
        if (!this.emptyBuilding(room)) {
            room.name = room.shortname + " " + room.number;
            this.rooms.push(room);
        }
    }

    private roomLevelRecursion(parent: any, room: Room) {
        for (let node of parent["childNodes"]) {
            if (node["nodeName"] === "div" || node["nodeName"] === "section") {
                this.roomLevelRecursion(node, room);
            } else if (node["nodeName"] === "table") {
                this.roomLevelTableSearch(node, room);
            }
        }
    }

    private roomLevelTableSearch(parent: any, room: Room) {
        let tbody: any;
        for (let node of parent["childNodes"]) {
            if (node["nodeName"] === "tbody") {
                tbody = node;
                break;
            }
        }
        for (let node of tbody["childNodes"]) {
            if (node["nodeName"] === "tr") {
                this.trSearcher(node, room);
            }
        }
    }

    private emptyBuilding(room: Room) {
        return room.type === undefined &&
            room.furniture === undefined &&
            room.seats === undefined &&
            room.number === undefined;
    }

    private trSearcher(node: any, room: Room) {
        for (let child of node["childNodes"]) {
            this.tdSearcher(child, room);
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
                } else if (child["value"] === "views-field views-field-field-room-number") {
                    room.number = node["childNodes"][1]["childNodes"][0]["value"].trim();
                } else if (child["value"] === "views-field views-field-field-room-capacity") {
                    room.seats = parseInt(node["childNodes"][0]["value"].trim(), 10);
                } else if (child["value"] === "views-field views-field-field-room-furniture") {
                    room.furniture = node["childNodes"][0]["value"].trim();
                } else if (child["value"] === "views-field views-field-field-room-type") {
                    room.type = node["childNodes"][0]["value"].trim();
                } else if (child["value"] === "views-field views-field-title") {
                    room.fullname = node["childNodes"][1]["childNodes"][0]["value"].trim();
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
        return this.parseRoomsZip("/index.htm")
            .then((indexhtm: any) => {
                Log.trace("parsed index.htm into a JSON object");
                let body: any = this.findHTMLBody(indexhtm);
                this.buildingLevelRecursion(body);
            })
            .then((result: any) => {
                return this.rooms;
            });
    }
}
