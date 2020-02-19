import Room from "./Room";

export default class Building {

    public room: Room;
    public htmlObj: any;

    constructor() {
        this.room = new Room(null);
    }
}
