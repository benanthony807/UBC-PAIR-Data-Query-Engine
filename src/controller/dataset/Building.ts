import Room from "./Room";

export default class Building {

    public buildingLevelRoomData: Room;
    public htmlObj: any;

    constructor() {
        this.buildingLevelRoomData = new Room(null);
    }
}
