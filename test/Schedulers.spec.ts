import Scheduler from "../src/scheduler/Scheduler";
import {SchedRoom, SchedSection, TimeSlot} from "../src/scheduler/IScheduler";
import {assert, expect} from "chai";


describe("Scheduler tests", function () {

    let scheduler: Scheduler;

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
});
