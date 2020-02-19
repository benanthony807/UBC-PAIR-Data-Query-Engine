import Log from "../Util";
import * as JSZip from "jszip";
import * as parse5 from "parse5";
import Room from "./Room";
import * as http from "http";
import {IncomingMessage} from "http";
import {rejects} from "assert";
import {InsightError} from "./IInsightFacade";
import Building from "./Building";

export default class RoomsDatasetHelper {

    private buildings: any[];
    private rooms: any[];
    private rawRooms: any[];
    private content: string;

    constructor() {
        this.rooms = [];
        this.buildings = [];
        this.rawRooms = [];
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
                reject(new InsightError("content wasn't a valid zip or wasn't in HTML format"));
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
        for (let child of parent["childNodes"]) {
            if (child["nodeName"] === "div" || child["nodeName"] === "section") {
                this.buildingLevelRecursion(child);
            } else if (child["nodeName"] === "table") {
                this.buildingLevelTableSearch(child);
            }
        }
    }

    private buildingLevelTableSearch(parent: any) {
        let tbody: any;
        for (let child of parent["childNodes"]) {
            if (child["nodeName"] === "tbody") {
                tbody = child;
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
        let building: Building = new Building();
        this.buildingLevelTrSearcher(node, building.room);
        // todo: not sure if building.room will actually be altered here
        Log.trace("found a building in index.htm, got its shortname, fullname, and address");
        this.buildings.push(building);
    }

    private buildingLevelTrSearcher(node: any, room: Room) {
        for (let child of node["childNodes"]) {
            this.tdSearcher(child, room);
        }
    }

    private roomBuilder(building: Building) {
        let tbody: any = this.findHTMLBody(building.htmlObj);
        // room level recursion should return an array of all the rooms it created
        // then the if block can iterate through the list
        this.roomLevelRecursion(tbody, building);
        Log.trace("room has been filled at this point, is ready to be pushed to rooms provided it's not empty");
        for (let room of this.rawRooms) {
            if (!this.isEmptyBuilding(room)) {
                room.name = room.shortname + " " + room.number;
                this.rooms.push(room);
            }
        }
    }

    private isEmptyBuilding(room: Room) {
        return room.type === undefined &&
            room.furniture === undefined &&
            room.seats === undefined &&
            room.number === undefined;
    }

    private roomLevelRecursion(parent: any, building: Building) {
        for (let node of parent["childNodes"]) {
            if (node["nodeName"] === "div" || node["nodeName"] === "section") {
                this.roomLevelRecursion(node, building);
            } else if (node["nodeName"] === "table") {
                this.roomLevelTableSearch(node, building);
            }
        }
    }

    private roomLevelTableSearch(parent: any, building: Building) {
        let tbody: any;
        for (let node of parent["childNodes"]) {
            if (node["nodeName"] === "tbody") {
                tbody = node;
                break;
            }
        }
        for (let node of tbody["childNodes"]) {
            if (node["nodeName"] === "tr") {
                this.roomLevelTrSearcher(node, building);
            }
        }
    }

    private roomLevelTrSearcher(node: any, building: Building) {
        let room = new Room(building);
        for (let child of node["childNodes"]) {
            this.tdSearcher(child, room);
        }
        this.rawRooms.push(room);
    }

    private tdSearcher(node: any, room: Room) {
        if (node["nodeName"] === "td") {
            for (let child of node["attrs"]) {
                if (child["value"] === "views-field views-field-nothing") {
                    room.href = this.aSearcher(node["childNodes"]);
                } else if (child["value"] === "views-field views-field-field-building-code") {
                    room.shortname = node["childNodes"][0]["value"].trim();
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


    private getLatLon(room: Room): Promise<any> {
        let encoded: string = encodeURI(room.address);
        let url: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team097/" + encoded;
        return new Promise<any>((resolve, reject) => {
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
                            reject("the lat/lon request resulted in an error");
                        }
                        room.lat = parsedData["lat"];
                        room.lon = parsedData["lon"];
                        resolve();
                    } catch (e) {
                        reject(e.message);
                    }
                });
            }).on("error", (e) => {
                reject(`Got error: ${e.message}`);
            });
        });
    }

    public getAllRoomsMasterMethod(content: string) {
        this.content = content;
        return this.parseRoomsZip("/index.htm")
            .then((indexhtm: any) => {
                Log.trace("parsed index.htm into a JSON object");
                let body: any = this.findHTMLBody(indexhtm);
                this.buildingLevelRecursion(body);
            })
            .then(() => {
                let promises: Array<Promise<void>> = [];
                for (let building of this.buildings) {
                    try {
                        promises.push(this.getLatLon(building));
                    } catch (err) {
                        this.buildings.splice(this.buildings.indexOf(building), 1);
                    }
                }
                return Promise.all(promises);
                // doesn't work
            })
            .then(() => {
                let promises: Array<Promise<void>> = [];
                for (let building of this.buildings) {
                    this.parseRoomsZip(building.room.href.substring(1))
                        .then((result: object) => {
                            building.htmlObj = result;
                        });
                }
            })
            .then(() => {
                for (let building of this.buildings) {
                    this.roomBuilder(building);
                }
                return this.rooms;
            })
            .catch((err: any) => {
                Log.trace("something went wrong, ended up in getAllRoomsMasterMethod catch block");
                return Promise.reject(err);
            });
    }
}

/* places of potential rejection:
- invalid zip (parseRoomsZip)
- file isn't HTML (wherever parse5 gets called)
- rooms is at least size 1 (check at top level)
 */
