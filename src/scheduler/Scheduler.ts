import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {

    // a map (i.e. an object) with TimeSlots as keys, arrays of {course_uuid, rooms_shortname+rooms_number}
    // used to check to make sure a timeslot doesn't already have the same section of a course
    // or the same room with a different course already booked
    private timeSlotMap: any;
    private isTimeSlotFilled: boolean[];
    private timeSlotIndex: number;

    constructor() {
        this.timeSlotMap = Scheduler.buildTimeSlotMap();
        this.isTimeSlotFilled = Array(15).fill(false);
        this.resetIsTimeSlotFilled();
        this.timeSlotIndex = 0;
    }

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = new Array<[SchedRoom, SchedSection, TimeSlot]>();
        // if there are more rooms than there are sections, this will remove the rooms with the lowest
        // utility from rooms (where utility = 0.7 * (# of seat) + 0.3 * (1 - (avg dist from other rooms))
        if (rooms.length > Math.ceil(sections.length / 15) && sections.length > 15) {
            Scheduler.pickBestRooms(rooms, Math.floor(rooms.length - sections.length / 15));
        }

        // sort both arrays for sections and rooms into descending order based on enrolment/capacity
        rooms.sort(function (a, b) {
            return b.rooms_seats - a.rooms_seats;
        });

        sections.sort((a: SchedSection, b: SchedSection) => {
            return Scheduler.getNumEnrolled(b) - Scheduler.getNumEnrolled(a);
        });


        let roomIndex: number = 0;
        let room: SchedRoom = rooms[roomIndex];

        for (let section of sections) {
            let timeSlot: TimeSlot = this.timeSlotPicker();

            if (this.isValidTuple(room, section, timeSlot)) {
                result.push([room, section, timeSlot]);
                this.timeSlotMap[timeSlot].push({
                    course: section.courses_dept + section.courses_id,
                    room: `${room.rooms_shortname} ${room.rooms_number}`
                });
                if (this.timeSlotIndex === 14) {
                    this.timeSlotIndex = 0;
                    this.resetIsTimeSlotFilled();
                    roomIndex++;
                    if (roomIndex >= rooms.length) {
                        return result;
                    }
                    room = rooms[roomIndex];
                } else {
                    this.isTimeSlotFilled[this.timeSlotIndex] = true;
                    this.timeSlotIndex++;
                }
            } else {
                if (Scheduler.sectionFitsInRoom(section, room)) {
                    this.findTimeSlotForSection(section, room, result);
                }
            }
        }
        return result;
    }

    // a tuple is valid (i.e. you can add this section in this room at this timeslot to the results array)
    // if the timeSlotMap doesn't already have the same section or the same room booked at that time
    private isValidTuple(room: SchedRoom, section: SchedSection, timeSlot: TimeSlot) {
        return !this.containsSection(section, timeSlot) &&
            !this.isTimeSlotFilled[Scheduler.getTimeSlotIndex(timeSlot)] &&
            Scheduler.sectionFitsInRoom(section, room);
    }

    private static sectionFitsInRoom(section: SchedSection, room: SchedRoom) {
        return Scheduler.getNumEnrolled(section) <= room.rooms_seats;
    }

    // returns distance (in meters) between two rooms
    private static calculateDistance(room1: SchedRoom, room2: SchedRoom): number {
        // distance function taken from https://www.movable-type.co.uk/scripts/latlong.html

        let lat1: number = room1.rooms_lat;
        let lon1: number = room1.rooms_lon;
        let lat2: number = room2.rooms_lat;
        let lon2: number = room2.rooms_lon;

        let earthRad = 6371e3; // metres
        let φ1 = Scheduler.toRadians(lat1);
        let φ2 = Scheduler.toRadians(lat2);
        let Δφ = Scheduler.toRadians((lat2 - lat1));
        let Δλ = Scheduler.toRadians(lon2 - lon1);

        let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return earthRad * c;
    }

    private static toRadians(deg: number): number {
        return deg * Math.PI / 180;
    }

    private static getNumEnrolled(section: SchedSection): number {
        return section.courses_audit + section.courses_pass + section.courses_fail;
    }

    // if the current timeslot has already been filled by some prev iteration of the for loop that couldn't
    // fit a section into a timeslot, this function will give you the first not full timeslot
    // this way everything in indices less than what's returned will be already full, and the for loop
    // doesn't have to continue going to its else block and looking ahead for timeslots
    // this basically doesn't do anything, it just makes the for loop easier to follow
    private timeSlotPicker(): TimeSlot {
        if (this.isTimeSlotFilled[this.timeSlotIndex]) {
            this.timeSlotIndex++;
            return this.timeSlotPicker();
        } else {
            return this.pickTimeSlot();
        }
    }

    private pickTimeSlot(): TimeSlot {
        switch (this.timeSlotIndex) {
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
            case 13:
                return "TR  1400-1530";
            default:
                return "TR  1530-1700";
        }
    }

    private static buildTimeSlotMap(): any {
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

    private containsSection(section: SchedSection, timeSlot: TimeSlot) {
        for (let element of this.timeSlotMap[timeSlot]) {
            // this should be dept + id
            if (element.course === section.courses_dept + section.courses_id) {
                return true;
            }
        }
        return false;
    }

// this should try to put the section in the closest timeslot to the one that it was originally intended for
    // and if every single timeslot is tried then for now we just naiively give up, in the future maybe can do
    // something with that
    // should it do anything with i? or mark the section it placed in as somehow used now?
    private findTimeSlotForSection
    (section: SchedSection, room: SchedRoom, result: Array<[SchedRoom, SchedSection, TimeSlot]>) {
        for (let i = 0; i < 15; i++) {
            let timeSlot = Object.keys(this.timeSlotMap)[i];
            if (this.isValidTuple(room, section, timeSlot as TimeSlot)) {
                result.push([room, section, timeSlot as TimeSlot]);
                this.isTimeSlotFilled[i] = true;
                this.timeSlotMap[timeSlot].push({
                    course: section.courses_dept + section.courses_id,
                    room: `${room.rooms_shortname} ${room.rooms_number}`
                });
                return;
            }
        }
        // the section doesn't fit into any section with this room
        //    should we try again with a different room? or give up
        //    one thing could do is insert the section 15 - timeSlotIndex
        //    timeslots down the line so it gets tried in the next room
    }

    private resetIsTimeSlotFilled() {
        for (let i = 0; i < 15; i++) {
            this.isTimeSlotFilled[i] = false;
        }
    }

    // removeThisMany is the floor of the difference between the rooms and the sections / 15, which means
    // there will be enough or one extra room to fit all the sections
    private static pickBestRooms(rooms: SchedRoom[], removeThisMany: number) {
        let utilityArray: Array<{ name: string, utility: number }> = [];
        for (let room of rooms) {
            let util: number = room.rooms_seats * 0.7 + 0.3 * (1 - this.getAvgDist(room, rooms, removeThisMany));
            utilityArray.push({name: room.rooms_shortname + room.rooms_number, utility: util});
        }
        utilityArray.sort((a, b) => {
            return b.utility - a.utility;
        });
        for (let i = utilityArray.length - removeThisMany; i < utilityArray.length; i++) {
            // TODO: this is using findIndex, unsure if this is how it works though
            rooms.splice(rooms.findIndex((r) => {
                return r.rooms_shortname + r.rooms_number === utilityArray[i].name;
            }), 1);
        }
    }

    private static getAvgDist(room: SchedRoom, rooms: SchedRoom[], removeThisMany: number): number {
        // initialize an array of size removeThisMany with all blank values, these will be updated
        // as we iterate through the rooms array
        let distArray: number[] = Array(removeThisMany).fill(0);
        for (let schedRoom of rooms) {
            for (let storedDist of distArray) {
                let currDist: number = Scheduler.calculateDistance(schedRoom, room);
                // if the distance between these rooms is bigger than anything we've seen before, bump out
                // whatever's being stored and exchange it for this one
                // todo: this is slow, definitely a better way to do this than sorting each time
                if (currDist > storedDist) {
                    storedDist = currDist;
                    distArray.sort((a, b) => b - a);
                    break;
                }
            }
        }
        return distArray.reduce((acc, currVal) => acc + currVal / removeThisMany);
    }

    private static getTimeSlotIndex(timeSlot: TimeSlot): number {
        switch (timeSlot) {
            case "MWF 0800-0900":
                return 0;
            case "MWF 0900-1000":
                return 1;
            case "MWF 1000-1100":
                return 2;
            case "MWF 1100-1200":
                return 3;
            case "MWF 1200-1300":
                return 4;
            case "MWF 1300-1400":
                return 5;
            case "MWF 1400-1500":
                return 6;
            case "MWF 1500-1600":
                return 7;
            case "MWF 1600-1700":
                return 8;
            case "TR  0800-0930":
                return 9;
            case "TR  0930-1100":
                return 10;
            case "TR  1100-1230":
                return 11;
            case "TR  1230-1400":
                return 12;
            case "TR  1400-1530":
                return 13;
            default:
                return 14;
        }
    }
}
