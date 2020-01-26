import * as fs from "fs-extra";
import {InsightDatasetKind} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import Dataset from "../src/controller/Dataset";
import Course from "../src/controller/Course";
import {expect} from "chai";

let assert = require("chai").assert;
const expectedCourses: Course[] = [{
    result: [{
        tier_eighty_five: 1,
        tier_ninety: 8,
        Title: "rsrch methdlgy",
        Section: "002",
        Detail: "",
        tier_seventy_two: 0,
        Other: 1,
        Low: 89,
        tier_sixty_four: 0,
        id: 31379,
        tier_sixty_eight: 0,
        tier_zero: 0,
        tier_seventy_six: 0,
        tier_thirty: 0,
        tier_fifty: 0,
        Professor: "",
        Audit: 9,
        tier_g_fifty: 0,
        tier_forty: 0,
        Withdrew: 1,
        Year: "2015",
        tier_twenty: 0,
        Stddev: 2.65,
        Enrolled: 20,
        tier_fifty_five: 0,
        tier_eighty: 0,
        tier_sixty: 0,
        tier_ten: 0,
        High: 98,
        Course: "504",
        Session: "w",
        Pass: 9,
        Fail: 0,
        Avg: 94.44,
        Campus: "ubc",
        Subject: "aanb"
    }, {
        tier_eighty_five: 1,
        tier_ninety: 8,
        Title: "rsrch methdlgy",
        Section: "overall",
        Detail: "",
        tier_seventy_two: 0,
        Other: 1,
        Low: 89,
        tier_sixty_four: 0,
        id: 31380,
        tier_sixty_eight: 0,
        tier_zero: 0,
        tier_seventy_six: 0,
        tier_thirty: 0,
        tier_fifty: 0,
        Professor: "",
        Audit: 9,
        tier_g_fifty: 0,
        tier_forty: 0,
        Withdrew: 1,
        Year: "2015",
        tier_twenty: 0,
        Stddev: 2.65,
        Enrolled: 20,
        tier_fifty_five: 0,
        tier_eighty: 0,
        tier_sixty: 0,
        tier_ten: 0,
        High: 98,
        Course: "504",
        Session: "w",
        Pass: 9,
        Fail: 0,
        Avg: 94.44,
        Campus: "ubc",
        Subject: "aanb"
    }], rank: 0
}];
const coursesWithInvalidSection: Course[] = [{
    result: [{
        tier_eighty_five: 1,
        tier_ninety: 8,
        Title: "rsrch methdlgy",
        Section: "002",
        Detail: "",
        tier_seventy_two: 0,
        Other: 1,
        Low: 89,
        tier_sixty_four: 0,
        id: 31379,
        tier_sixty_eight: 0,
        tier_zero: 0,
        tier_seventy_six: 0,
        tier_thirty: 0,
        tier_fifty: 0,
        Professor: "",
        Audit: 9,
        tier_g_fifty: 0,
        tier_forty: 0,
        Withdrew: 1,
        Year: "2015",
        tier_twenty: 0,
        Stddev: 2.65,
        Enrolled: 20,
        tier_fifty_five: 0,
        tier_eighty: 0,
        tier_sixty: 0,
        tier_ten: 0,
        High: 98,
        Course: "504",
        Session: "w",
        Pass: 9,
        Fail: 0,
        Campus: "ubc",
        Subject: "aanb"
    }, {
        tier_eighty_five: 1,
        tier_ninety: 8,
        Title: "rsrch methdlgy",
        Section: "overall",
        Detail: "",
        tier_seventy_two: 0,
        Other: 1,
        Low: 89,
        tier_sixty_four: 0,
        id: 31380,
        tier_sixty_eight: 0,
        tier_zero: 0,
        tier_seventy_six: 0,
        tier_thirty: 0,
        tier_fifty: 0,
        Professor: "",
        Audit: 9,
        tier_g_fifty: 0,
        tier_forty: 0,
        Withdrew: 1,
        Year: "2015",
        tier_twenty: 0,
        Stddev: 2.65,
        Enrolled: 20,
        tier_fifty_five: 0,
        tier_eighty: 0,
        tier_sixty: 0,
        tier_ten: 0,
        High: 98,
        Course: "504",
        Session: "w",
        Pass: 9,
        Fail: 0,
        Avg: 94.44,
        Campus: "ubc",
        Subject: "aanb"
    }], rank: 0
}];

const expectedCourses2: Course[] = [{
    result: [{
        tier_eighty_five: 1,
        tier_ninety: 8,
        Title: "rsrch methdlgy",
        Section: "overall",
        Detail: "",
        tier_seventy_two: 0,
        Other: 1,
        Low: 89,
        tier_sixty_four: 0,
        id: 31380,
        tier_sixty_eight: 0,
        tier_zero: 0,
        tier_seventy_six: 0,
        tier_thirty: 0,
        tier_fifty: 0,
        Professor: "",
        Audit: 9,
        tier_g_fifty: 0,
        tier_forty: 0,
        Withdrew: 1,
        Year: "2015",
        tier_twenty: 0,
        Stddev: 2.65,
        Enrolled: 20,
        tier_fifty_five: 0,
        tier_eighty: 0,
        tier_sixty: 0,
        tier_ten: 0,
        High: 98,
        Course: "504",
        Session: "w",
        Pass: 9,
        Fail: 0,
        Avg: 94.44,
        Campus: "ubc",
        Subject: "aanb"
    }], rank: 0
}];

describe("Dataset Methods", function () {

    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        empty: "./test/data/empty.zip",
        onecourseemptyjson: "./test/data/onecourseemptyjson.zip",
        onecourseemptymessage: "./test/data/onecourseemptymessage.zip",
        duplicatecourse: "./test/data/duplicatecourse.zip",
        nocoursesfolder: "./test/data/nocoursesfolder.zip",
        onevalidfileothersnot: "./test/data/onevalidfileothersnot.zip",
        valid1course: "./test/data/valid1course.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
            Log.test(datasets[id]);
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    describe("constructor tests", function () {

        it("should produce a dataset", function () {
            const id: string = "AANB504";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const content: string = datasets[id];

            let ds: Dataset = new Dataset(id, kind, content);
            assert.deepEqual(id, ds.getId());
            assert.deepEqual(kind, ds.getKind());
            assert.deepEqual(expectedCourses, ds.getCourses());
        });
    });

    describe("getNumRows tests", function () {

        it("should return 2", function () {
            const id: string = "AANB504";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const content: string = datasets[id];

            let ds: Dataset = new Dataset(id, kind, content);
            assert.deepEqual(2, ds.getNumRows());
        });
    });

    describe("checkCoursesNotEmpty tests", function () {

        it("should resolve, courses not empty", function () {
            const id: string = "AANB504";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const content: string = datasets[id];
            const expected: void = null;

            let ds: Dataset = new Dataset(id, kind, content);
            ds.checkCoursesNotEmpty()
                .then((result: void) => {
                    expect(result).to.deep.equal(expected);
                })
                .catch((err: any) => {
                    expect.fail(err, expected, "Should not have rejected");
                });
        });

        it("should reject, courses empty", function () {
            const id: string = "AANB504";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const content: string = datasets[id];
            const expected: void = null;
            const emptyCourses: Course[] = [{result: [], rank: 0}, {result: [], rank: 0}];

            let ds: Dataset = new Dataset(id, kind, content);
            ds.setCoursesForTesting(emptyCourses);
            ds.checkCoursesNotEmpty()
                .then((result: void) => {
                    expect.fail("should have rejected, courses is empty");
                })
                .catch((err: any) => {
                    expect(err).to.deep.equal(expected);
                });
        });
    });

    describe("hasAllRequiredFields tests", function () {

        it("should return true, section has all required fields", function () {
            const id: string = "AANB504";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const content: string = datasets[id];
            const section: object = {
                tier_eighty_five: 1,
                tier_ninety: 8,
                Title: "rsrch methdlgy",
                Section: "002",
                Detail: "",
                tier_seventy_two: 0,
                Other: 1,
                Low: 89,
                tier_sixty_four: 0,
                id: 31379,
                tier_sixty_eight: 0,
                tier_zero: 0,
                tier_seventy_six: 0,
                tier_thirty: 0,
                tier_fifty: 0,
                Professor: "",
                Audit: 9,
                tier_g_fifty: 0,
                tier_forty: 0,
                Withdrew: 1,
                Year: "2015",
                tier_twenty: 0,
                Stddev: 2.65,
                Enrolled: 20,
                tier_fifty_five: 0,
                tier_eighty: 0,
                tier_sixty: 0,
                tier_ten: 0,
                High: 98,
                Course: "504",
                Session: "w",
                Pass: 9,
                Fail: 0,
                Avg: 94.44,
                Campus: "ubc",
                Subject: "aanb"
            };

            let ds: Dataset = new Dataset(id, kind, content);
            assert.isTrue(ds.hasAllRequiredFields(section));
        });

        it("should return false, section missing Subject field", function () {
            const id: string = "AANB504";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const content: string = datasets[id];
            const section: object = {
                tier_eighty_five: 1,
                tier_ninety: 8,
                Title: "rsrch methdlgy",
                Section: "002",
                Detail: "",
                tier_seventy_two: 0,
                Other: 1,
                Low: 89,
                tier_sixty_four: 0,
                id: 31379,
                tier_sixty_eight: 0,
                tier_zero: 0,
                tier_seventy_six: 0,
                tier_thirty: 0,
                tier_fifty: 0,
                Professor: "",
                Audit: 9,
                tier_g_fifty: 0,
                tier_forty: 0,
                Withdrew: 1,
                Year: "2015",
                tier_twenty: 0,
                Stddev: 2.65,
                Enrolled: 20,
                tier_fifty_five: 0,
                tier_eighty: 0,
                tier_sixty: 0,
                tier_ten: 0,
                High: 98,
                Course: "504",
                Session: "w",
                Pass: 9,
                Fail: 0,
                Avg: 94.44,
                Campus: "ubc"
            };

            let ds: Dataset = new Dataset(id, kind, content);
            assert.isFalse(ds.hasAllRequiredFields(section));
        });
    });

    describe("filterInvalidSections tests", function () {

        it("should not filter any sections", function () {
            const id: string = "AANB504";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const content: string = datasets[id];

            let ds: Dataset = new Dataset(id, kind, content);
            assert(expectedCourses).to.deep.equal(ds.getCourses());
        });

        it("should filter out first section, missing avg field", function () {
            const id: string = "AANB504";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const content: string = datasets[id];

            let ds: Dataset = new Dataset(id, kind, content);
            ds.setCoursesForTesting(coursesWithInvalidSection);
            assert(expectedCourses2).to.deep.equal(ds.getCourses());
        });
    });
});

