import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // TODO Implement this
        // make a map of all of the different courses, indexed by size
        return [];
    }

    public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        // distance function taken from https://www.movable-type.co.uk/scripts/latlong.html
        let earthRad = 6371e3; // metres
        let φ1 = this.toRadians(lat1);
        let φ2 = this.toRadians(lat2);
        let Δφ = this.toRadians((lat2 - lat1));
        let Δλ = this.toRadians(lon2 - lon1);

        let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return earthRad * c;
    }

    public toRadians(deg: number): number {
        return deg * Math.PI / 180;
    }
}
