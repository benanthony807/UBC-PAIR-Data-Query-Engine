import Building from "./Building";

export default class Room {

    public fullname: string; // e.g. "Hugh Dempster Pavillion"
    public shortname: string; // e.g. "DMP"
    public number: string; // e.g. "201"
    public name: string; // e.g. "DMP 201"
    public address: string; // e.g. "6245 Agronomy Road V6T 1Z4"
    public lat: number;
    public lon: number;
    public seats: number; // e.g. 40, 0 if this value is missing in the dataset
    public type: string; // e.g. "Small Group"
    public furniture: string; // e.g. "Classroom-Movable Tables & Chairs"
    public href: string; // e.g. "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/DMP-201"
                         // collected from index.htm More Info Link

    constructor(building: Building) {
        if (building !== null) {
            this.fullname = building.buildingLevelRoomData.fullname;
            this.shortname = building.buildingLevelRoomData.shortname;
            this.address = building.buildingLevelRoomData.address;
            this.lat = building.buildingLevelRoomData.lat;
            this.lon = building.buildingLevelRoomData.lon;
        } else {
            this.href = null;
            this.address = null;
        }
    }
}


// any field with can have an empty input I think
// a building with no rooms can be ignored
// if you get an error from requesting geolocation ignore that building
// valid dataset has to have at least one valid room
// can assume HTML elements will always be in the same form as in the zip file
// can't assume there's only one <table> in a file, but
    // can assume that whatever table has the building data is the only one with room data in that file
// elements might be in different locations between diff HTML trees
// get lat/lon using http, and URL encoded address, have to match how the address is
    // in the data file exactly
// to get the address pretty sure we just use the http GET method
