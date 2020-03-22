import Scheduler from "../src/scheduler/Scheduler";
import {SchedRoom, SchedSection, TimeSlot} from "../src/scheduler/IScheduler";
import {assert, expect} from "chai";


describe("Scheduler tests", function () {

    let scheduler: Scheduler;
    let sectionsTest2: SchedSection[] = [
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "3397",
            courses_pass: 171,
            courses_fail: 3,
            courses_audit: 1
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "62413",
            courses_pass: 93,
            courses_fail: 2,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "72385",
            courses_pass: 43,
            courses_fail: 1,
            courses_audit: 0
        }
    ];
    let roomsTest2: SchedRoom[] = [
        {
            rooms_shortname: "AERL",
            rooms_number: "120",
            rooms_seats: 144,
            rooms_lat: 49.26372,
            rooms_lon: -123.25099
        },
        {
            rooms_shortname: "ALRD",
            rooms_number: "105",
            rooms_seats: 94,
            rooms_lat: 49.2699,
            rooms_lon: -123.25318
        },
        {
            rooms_shortname: "ANGU",
            rooms_number: "098",
            rooms_seats: 260,
            rooms_lat: 49.26486,
            rooms_lon: -123.25364
        },
        {
            rooms_shortname: "BUCH",
            rooms_number: "A101",
            rooms_seats: 275,
            rooms_lat: 49.26826,
            rooms_lon: -123.25468
        }
    ];

    let expectedTest2: Array<[SchedRoom, SchedSection, TimeSlot]> = [
            [
                {
                    rooms_lat: 49.26826,
                    rooms_lon: -123.25468,
                    rooms_number: "A101",
                    rooms_seats: 275,
                    rooms_shortname: "BUCH"
                },
                {
                    courses_audit: 1,
                    courses_dept: "cpsc",
                    courses_fail: 3,
                    courses_id: "340",
                    courses_pass: 171,
                    courses_uuid: "3397",
                },
                "MWF 0800-0900"
            ],
            [
                {
                    rooms_lat: 49.26826,
                    rooms_lon: -123.25468,
                    rooms_number: "A101",
                    rooms_seats: 275,
                    rooms_shortname: "BUCH",
                },
                {
                    courses_audit: 2,
                    courses_dept: "cpsc",
                    courses_fail: 7,
                    courses_id: "340",
                    courses_pass: 101,
                    courses_uuid: "1319",
                },
                "MWF 0900-1000"
            ], [
                {
                    rooms_lat: 49.26826,
                    rooms_lon: -123.25468,
                    rooms_number: "A101",
                    rooms_seats: 275,
                    rooms_shortname: "BUCH",
                },
                {
                    courses_audit: 0,
                    courses_dept: "cpsc",
                    courses_fail: 2, courses_id: "344",
                    courses_pass: 93,
                    courses_uuid: "62413",
                },
                "MWF 1000-1100"
            ],
            [
                {
                    rooms_lat: 49.26826,
                    rooms_lon: -123.25468,
                    rooms_number: "A101",
                    rooms_seats: 275,
                    rooms_shortname: "BUCH",
                },
                {
                    courses_audit: 0,
                    courses_dept: "cpsc",
                    courses_fail: 1,
                    courses_id: "344",
                    courses_pass: 43,
                    courses_uuid: "72385",
                },
                "MWF 1100-1200"
            ]];

    before(function () {
        //
    });

    beforeEach(function () {
        scheduler = new Scheduler();
    });

    after(function () {
        //
    });

    afterEach(function () {
        //
    });

    it("should return the only section in the only room in a timeslot", function () {
        let sections: SchedSection[] = [{
            courses_dept: "a",
            courses_id: "b",
            courses_uuid: "c",
            courses_pass: 1,
            courses_fail: 1,
            courses_audit: 1,
        }];
        let rooms: SchedRoom[] = [{
            rooms_shortname: "roomname",
            rooms_number: "123A",
            rooms_seats: 30,
            rooms_lat: 30.404955,
            rooms_lon: 39.303945,
        }];
        let expected: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        expected.push([rooms[0], sections[0], "MWF 0800-0900"]);

        expect(scheduler.schedule(sections, rooms)).to.deep.equal(expected);
    });

    it("surplus of rooms, should return all sections in sequential timeslots in the first room", function () {
        expect(scheduler.schedule(sectionsTest2, roomsTest2)).to.deep.equal(expectedTest2);
    });
});
