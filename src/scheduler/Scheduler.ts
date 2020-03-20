import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = new Array<[SchedRoom, SchedSection, TimeSlot]>();
        // sort both arrays for sections and rooms into descending order based on enrolment/capacity
        rooms.sort(function (a, b) {
            return b.rooms_seats - a.rooms_seats;
        });
        sections.sort((a: SchedSection, b: SchedSection) => {
            return this.getNumEnrolled(b) - this.getNumEnrolled(a);
        });
        // a map where keys are timeslots, values are arrays of courses scheduled in that timeslot
        // used to make sure no 2 courses are scheduled in the same timeslot
        let timeSlotMap: any = this.buildTimeSlotMap();
        let roomIndex: number = 0;
        let room: SchedRoom = rooms[roomIndex];
        let timeSlotIndex: number = 0;
        for (let i: number = 0; i < sections.length; i++) {
            let section = sections[i];
            if (!timeSlotMap[this.pickTimeSlot(timeSlotIndex)].includes(section.courses_title) &&
                this.getNumEnrolled(section) <= room.rooms_seats) {
                result.push([room, section, this.pickTimeSlot(timeSlotIndex)]);
                if (timeSlotIndex === 14) {
                    timeSlotIndex = 0;
                    roomIndex++;
                    if (roomIndex >= rooms.length) {
                        return result;
                    }
                    room = rooms[roomIndex];
                } else {
                    timeSlotIndex++;
                }
            } else {
                if (this.getNumEnrolled(section) <= room.rooms_seats) {
                    i = i;
                   // put the section back in the queue somehow to be tried again
                }
            }
        }
        return result;
    }

    // so we have two days, tues/thurs or mon/wed/fri
    // m/w/f has 9 time slots, t/th has 6
    // so we have 15 slots total
    // and we're given a list of rooms that's variable, and a list of courses to schedule that's also variable
    // but we can assume the list of courses and rooms contains no duplicates and are both non empty
    // says nothing about if there are enough rooms for all of the courses, which could be an edge case
    // so that paper I read suggested the first thing you want to do is place them all with
    //  instructors and timeslots, then do rooms later
    // I think maybe it's better to start with rooms
    // try to distribute which rooms get used as evenly as possible
    // and then fit the time slots in after
    // and then with whatever doesn't fit, place them in the empty rooms/timeslots remaining

    // returns distance (in meters) between two rooms
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

    private toRadians(deg: number): number {
        return deg * Math.PI / 180;
    }

    private getNumEnrolled(section: SchedSection): number {
        return section.courses_audit + section.courses_pass + section.courses_fail;
    }

    private pickTimeSlot(timeSlotCount: number): TimeSlot {
        switch (timeSlotCount) {
            case 0:
                return "MWF 0800-0900";
            case 1:
                return "MWF 0900-1000";
            case 2:
                return "MWF 1000-1100";
            case 3:
                return "MWF 1100-1200";
            case 4:
                return "MWF 1200-1300";
            case 5:
                return "MWF 1300-1400";
            case 6:
                return "MWF 1400-1500";
            case 7:
                return "MWF 1500-1600";
            case 8:
                return "MWF 1600-1700";
            case 9:
                return "TR  0800-0930";
            case 10:
                return "TR  0930-1100";
            case 11:
                return "TR  1100-1230";
            case 12:
                return "TR  1230-1400";
            case 14:
                return "TR  1400-1530";
            default:
                return "TR  1530-1700";
        }
    }

    private buildTimeSlotMap(): any {
       return {
            "MWF 0800-0900": [],
            "MWF 0900-1000": [],
            "MWF 1000-1100": [],
            "MWF 1100-1200": [],
            "MWF 1200-1300": [],
            "MWF 1300-1400": [],
            "MWF 1400-1500": [],
            "MWF 1500-1600": [],
            "MWF 1600-1700": [],
            "TR  0800-0930": [],
            "TR  0930-1100": [],
            "TR  1100-1230": [],
            "TR  1230-1400": [],
            "TR  1400-1530": [],
            "TR  1530-1700": [],
        };
    }
}
