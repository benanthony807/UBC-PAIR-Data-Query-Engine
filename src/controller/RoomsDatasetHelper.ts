import Log from "../Util";
import * as JSZip from "jszip";
import * as parse5 from "parse5";
import Room from "./Room";

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

    // private tableSearcher(parent: any) {
    //     for (let node of parent["childNodes"]) {
    //         if (node["nodeName"] === "tbody") {
    //             return node;
    //         }
    //     }
    // }

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
            // do the lat/lon stuff here
            // try catch this so that if it results in an error we go no further with this room, it's invalid
        }
        if (room.href !== null) {
            this.parseRoomsZip(room.href)
                .then((roomHTML: any) => {
                    this.roomBuilder(roomHTML, room);
                });
        }
    }

    private roomBuilder(node: any, room: Room) {
        let tbody: any = this.findHTMLBody(node);
        this.roomLevelRecursion(tbody, room);
        Log.trace("room has been filled at this point, is ready to be pushed to rooms provided it's not empty");
        // if the room's fields that should've been filled in at this point (number, seats, furniture, type)
        // then the building has no rooms, can skip this (*** check to make sure that if u have a building with no rooms
        // you'll just not get to this point, the recursion might catch it)
        this.rooms.push(room);
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

    private trSearcher(node: any, room: Room) {
        // if (node["nodeName"] === "tr") {
            for (let child of node["childNodes"]) {
                this.tdSearcher(child, room);
            }
        // }
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
                    room.number = node["childNodes"][0]["value"].trim();
                } else if (child["value"] === "views-field views-field-field-room-capacity") {
                    room.seats = parseInt(node["childNodes"][0]["value"].trim(), 10);
                } else if (child["value"] === "views-field views-field-field-room-furniture") {
                    room.furniture = node["childNodes"][0]["value"].trim();
                } else if (child["value"] === "views-field views-field-field-room-type") {
                    room.type = node["childNodes"][0]["value"].trim();
                } else if (child["value"] === "views-field views-field-field-room-type") {
                    room.type = node["childNodes"][0]["value"].trim();
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
                let body: any = this.findHTMLBody(indexhtm);
                this.buildingLevelRecursion(body);
            })
            .then((result: any) => {
                return this.rooms;
            });
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
}
