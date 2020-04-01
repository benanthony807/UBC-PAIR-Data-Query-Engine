import Log from "../../Util";
import * as JSZip from "jszip";
import * as parse5 from "parse5";
import Room from "./Room";
import * as http from "http";
import {IncomingMessage} from "http";
import {rejects} from "assert";
import {InsightError} from "../IInsightFacade";
import Building from "./Building";

export default class RoomsDatasetHelper {

    private buildings: any[];
    private rooms: any[];
    private rawRooms: any[];
    private content: string;
    private jsZip: JSZip;

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
                        this.jsZip = zip;
                        zip.file("rooms" + fileName)
                            .async("text")
                            .then((htmlAsString: string) => {
                                resolve(parse5.parse(htmlAsString));
                            });
                    });
            } catch (err) {
                Log.trace("parseRoomsZip rejected with err " + err);
                reject(new InsightError("content wasn't a valid zip"));
            }
        });
    }

    public parseHTML(building: Building): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            try {
                this.jsZip.file("rooms" + building.buildingLevelRoomData.href.substring(1))
                    .async("text")
                    .then((htmlAsString: string) => {
                        building.htmlObj = parse5.parse(htmlAsString);
                        resolve();
                    });
            } catch (err) {
                Log.trace("parseHTML rejected with err " + err);
                Log.trace("building " + building.buildingLevelRoomData.fullname + " wasn't in HTML format");
                resolve();
            }
        });
    }

    public findHTMLBody(indexhtm: any) {
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
        this.buildingLevelTrSearcher(node, building.buildingLevelRoomData);
        // Log.trace("found a building in index.htm, got its shortname, fullname, and address");
        this.buildings.push(building);
    }

    private buildingLevelTrSearcher(node: any, room: Room) {
        for (let child of node["childNodes"]) {
            this.tdSearcher(child, room);
        }
    }

    private roomBuilder(building: Building) {
        let tbody: any = this.findHTMLBody(building.htmlObj);
        this.roomLevelRecursion(tbody, building);
        // Log.trace("room has been filled at this point, is ready to be pushed to rooms provided it's not empty");
    }

    private isEmptyBuilding(room: Room) {
        return room.type === undefined ||
            room.furniture === undefined ||
            room.number === undefined ||
            room.seats === undefined;
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


    private getLatLon(building: Building): Promise<any> {
        let encoded: string = encodeURI(building.buildingLevelRoomData.address);
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
                            resolve("the lat/lon request resulted in an error");
                        }
                        building.buildingLevelRoomData.lat = parsedData["lat"];
                        building.buildingLevelRoomData.lon = parsedData["lon"];
                        resolve();
                    } catch (e) {
                        this.buildings.splice(this.buildings.indexOf(building), 1);
                        resolve();
                    }
                });
            }).on("error", (e) => {
                this.buildings.splice(this.buildings.indexOf(building), 1);
                resolve(`Got error: ${e.message}`);
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
                Log.trace("Found all of the buildings in index.htm");
                let promises: Array<Promise<void>> = [];
                for (let building of this.buildings) {
                    promises.push(this.getLatLon(building));
                }
                return Promise.all(promises);
            })
            .then(() => {
                Log.trace("got the lat/lon of each building, discarded those without lat/lon");
                let promises: Array<Promise<void>> = [];
                for (let building of this.buildings) {
                    promises.push(this.parseHTML(building));
                }
                return Promise.all(promises);
            })
            .then(() => {
                Log.trace("parsed the html for each building into a JSON object");
                for (let building of this.buildings) {
                    if (building.htmlObj !== undefined) {
                        this.roomBuilder(building);
                    }
                }
                this.filterIncompleteRooms();
                Log.trace("filled the remaining fields for each room, discarded those with incomplete fields");
                return this.rooms;
            })
            .catch((err: any) => {
                Log.trace("something went wrong, ended up in getAllRoomsMasterMethod catch block");
                return Promise.reject(err);
            });
    }

    private filterIncompleteRooms() {
        for (let room of this.rawRooms) {
            if (!this.isEmptyBuilding(room)) {
                room.name = room.shortname + "_" + room.number;
                if (room.seats === undefined) {
                    room.seats = 0;
                }
                this.rooms.push(room);
            }
        }
    }
}
