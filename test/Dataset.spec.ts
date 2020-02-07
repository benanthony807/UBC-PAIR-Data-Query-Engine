// import * as fs from "fs-extra";
// import {InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
// import InsightFacade from "../src/controller/InsightFacade";
// import Log from "../src/Util";
// import Dataset from "../src/controller/Dataset";
// import Course from "../src/controller/Course";
// import {expect} from "chai";
// import DatasetHelper from "../src/controller/DatasetHelper";
//
// let assert = require("chai").assert;
// const expectedCourses: Course[] = [{
//     result: [{
//         tier_eighty_five: 1,
//         tier_ninety: 8,
//         Title: "rsrch methdlgy",
//         Section: "002",
//         Detail: "",
//         tier_seventy_two: 0,
//         Other: 1,
//         Low: 89,
//         tier_sixty_four: 0,
//         id: "31379",
//         tier_sixty_eight: 0,
//         tier_zero: 0,
//         tier_seventy_six: 0,
//         tier_thirty: 0,
//         tier_fifty: 0,
//         Professor: "",
//         Audit: 9,
//         tier_g_fifty: 0,
//         tier_forty: 0,
//         Withdrew: 1,
//         Year: 2015,
//         tier_twenty: 0,
//         Stddev: 2.65,
//         Enrolled: 20,
//         tier_fifty_five: 0,
//         tier_eighty: 0,
//         tier_sixty: 0,
//         tier_ten: 0,
//         High: 98,
//         Course: "504",
//         Session: "w",
//         Pass: 9,
//         Fail: 0,
//         Avg: 94.44,
//         Campus: "ubc",
//         Subject: "aanb"
//     }, {
//         tier_eighty_five: 1,
//         tier_ninety: 8,
//         Title: "rsrch methdlgy",
//         Section: "overall",
//         Detail: "",
//         tier_seventy_two: 0,
//         Other: 1,
//         Low: 89,
//         tier_sixty_four: 0,
//         id: "31380",
//         tier_sixty_eight: 0,
//         tier_zero: 0,
//         tier_seventy_six: 0,
//         tier_thirty: 0,
//         tier_fifty: 0,
//         Professor: "",
//         Audit: 9,
//         tier_g_fifty: 0,
//         tier_forty: 0,
//         Withdrew: 1,
//         Year: 1900,
//         tier_twenty: 0,
//         Stddev: 2.65,
//         Enrolled: 20,
//         tier_fifty_five: 0,
//         tier_eighty: 0,
//         tier_sixty: 0,
//         tier_ten: 0,
//         High: 98,
//         Course: "504",
//         Session: "w",
//         Pass: 9,
//         Fail: 0,
//         Avg: 94.44,
//         Campus: "ubc",
//         Subject: "aanb"
//     }], rank: 0
// }];
// const coursesWithInvalidSection: Course[] = [{
//     result: [{
//         tier_eighty_five: 1,
//         tier_ninety: 8,
//         Title: "rsrch methdlgy",
//         Section: "002",
//         Detail: "",
//         tier_seventy_two: 0,
//         Other: 1,
//         Low: 89,
//         tier_sixty_four: 0,
//         id: 31379,
//         tier_sixty_eight: 0,
//         tier_zero: 0,
//         tier_seventy_six: 0,
//         tier_thirty: 0,
//         tier_fifty: 0,
//         Professor: "",
//         Audit: 9,
//         tier_g_fifty: 0,
//         tier_forty: 0,
//         Withdrew: 1,
//         Year: "2015",
//         tier_twenty: 0,
//         Stddev: 2.65,
//         Enrolled: 20,
//         tier_fifty_five: 0,
//         tier_eighty: 0,
//         tier_sixty: 0,
//         tier_ten: 0,
//         High: 98,
//         Course: "504",
//         Session: "w",
//         Pass: 9,
//         Fail: 0,
//         Campus: "ubc",
//         Subject: "aanb"
//     }, {
//         tier_eighty_five: 1,
//         tier_ninety: 8,
//         Title: "rsrch methdlgy",
//         Section: "overall",
//         Detail: "",
//         tier_seventy_two: 0,
//         Other: 1,
//         Low: 89,
//         tier_sixty_four: 0,
//         id: 31380,
//         tier_sixty_eight: 0,
//         tier_zero: 0,
//         tier_seventy_six: 0,
//         tier_thirty: 0,
//         tier_fifty: 0,
//         Professor: "",
//         Audit: 9,
//         tier_g_fifty: 0,
//         tier_forty: 0,
//         Withdrew: 1,
//         Year: "2015",
//         tier_twenty: 0,
//         Stddev: 2.65,
//         Enrolled: 20,
//         tier_fifty_five: 0,
//         tier_eighty: 0,
//         tier_sixty: 0,
//         tier_ten: 0,
//         High: 98,
//         Course: "504",
//         Session: "w",
//         Pass: 9,
//         Fail: 0,
//         Avg: 94.44,
//         Campus: "ubc",
//         Subject: "aanb"
//     }], rank: 0
// }];
//
// const expectedCourses2: Course[] = [{
//     result: [{
//         tier_eighty_five: 1,
//         tier_ninety: 8,
//         Title: "rsrch methdlgy",
//         Section: "overall",
//         Detail: "",
//         tier_seventy_two: 0,
//         Other: 1,
//         Low: 89,
//         tier_sixty_four: 0,
//         id: 31380,
//         tier_sixty_eight: 0,
//         tier_zero: 0,
//         tier_seventy_six: 0,
//         tier_thirty: 0,
//         tier_fifty: 0,
//         Professor: "",
//         Audit: 9,
//         tier_g_fifty: 0,
//         tier_forty: 0,
//         Withdrew: 1,
//         Year: "2015",
//         tier_twenty: 0,
//         Stddev: 2.65,
//         Enrolled: 20,
//         tier_fifty_five: 0,
//         tier_eighty: 0,
//         tier_sixty: 0,
//         tier_ten: 0,
//         High: 98,
//         Course: "504",
//         Session: "w",
//         Pass: 9,
//         Fail: 0,
//         Avg: 94.44,
//         Campus: "ubc",
//         Subject: "aanb"
//     }], rank: 0
// }];
//
// describe("Dataset Methods", function () {
//
//     const datasetsToLoad: { [id: string]: string } = {
//         courses: "./test/data/courses.zip",
//         empty: "./test/data/empty.zip",
//         onecourseemptyjson: "./test/data/onecourseemptyjson.zip",
//         onecoursenosections: "./test/data/onecoursenosections.zip",
//         duplicatecourse: "./test/data/duplicatecourse.zip",
//         nocoursesfolder: "./test/data/nocoursesfolder.zip",
//         onevalidfileothersnot: "./test/data/onevalidfileothersnot.zip",
//         valid1course: "./test/data/valid1course.zip",
//         AAN: "./test/data/AAN.zip"
//     };
//     let datasets: { [id: string]: string } = {};
//     let insightFacade: InsightFacade;
//     const cacheDir = __dirname + "/../data";
//
//     before(function () {
//         // This section runs once and loads all datasets specified in the datasetsToLoad object
//         // into the datasets object
//         Log.test(`Before all`);
//         for (const id of Object.keys(datasetsToLoad)) {
//             datasets[id] = fs
//                 .readFileSync(datasetsToLoad[id])
//                 .toString("base64");
//         }
//     });
//
//     beforeEach(function () {
//         // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
//         // This runs before each test, which should make each test independent from the previous one
//         Log.test(`BeforeTest: ${this.currentTest.title}`);
//         try {
//             fs.removeSync(cacheDir);
//             fs.mkdirSync(cacheDir);
//             insightFacade = new InsightFacade();
//         } catch (err) {
//             Log.error("ERROR: " + err);
//         }
//     });
//
//     after(function () {
//         Log.test(`After: ${this.test.parent.title}`);
//     });
//
//     afterEach(function () {
//         Log.test(`AfterTest: ${this.currentTest.title}`);
//     });
//
//     describe("constructor tests", function () {
//     // fails expectedly, formatSections isn't run on courses yet
//         it("should produce a dataset", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const content: string = datasets[id];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             datasetHelper.readContent(content)
//                 .then((courses: Course[]) => {
//                     let ds: Dataset = new Dataset(id, kind, courses);
//                     assert.deepEqual(id, ds["id"]);
//                     assert.deepEqual(kind, ds["kind"]);
//                     // assert.deepEqual(expectedCourses, ds["courses"]);
//                 });
//         });
//     });
//
//     describe("getNumRows tests", function () {
//
//         it("should return 2", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const content: string = datasets[id];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             datasetHelper.readContent(content)
//                 .then((courses: Course[]) => {
//                     let ds: Dataset = new Dataset(id, kind, courses);
//                     assert.deepEqual(2, ds.getNumRows());
//                 });
//         });
//     });
//
//     describe("checkCoursesNotEmpty tests", function () {
//
//         it("should resolve, courses not empty", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const content: string = datasets[id];
//             const expected: void = null;
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             return datasetHelper.readContent(content)
//                 .then((courses: Course[]) => {
//                     return new Dataset(id, kind, courses);
//                 })
//                 .then((ds: Dataset) => {
//                     ds.checkCoursesNotEmpty()
//                         .then((result: any) => {
//                             assert.equal(result, ds);
//                             // expect(result).to.deep.equal(expected);
//                         })
//                         .catch((err: any) => {
//                             expect.fail(err, expected, "Should not have rejected");
//                         });
//                 });
//         });
//
//         it("should reject, courses empty", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const content: string = datasets[id];
//             const expected: void = null;
//             const emptyCourses: Course[] = [{result: [], rank: 0}, {result: [], rank: 0}];
//
//             let ds: Dataset = new Dataset(id, kind, emptyCourses);
//             return ds.checkCoursesNotEmpty()
//                 .then((result: any) => {
//                     expect.fail("should have rejected, courses is empty");
//                 })
//                 .catch((err: any) => {
//                     assert.instanceOf(err, InsightError);
//                 });
//         });
//     });
//
//     describe("hasAllRequiredFields tests", function () {
//
//         it("should return true, section has all required fields", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const courses: Course[] = [];
//             const section: object = {
//                 tier_eighty_five: 1,
//                 tier_ninety: 8,
//                 Title: "rsrch methdlgy",
//                 Section: "002",
//                 Detail: "",
//                 tier_seventy_two: 0,
//                 Other: 1,
//                 Low: 89,
//                 tier_sixty_four: 0,
//                 id: "31379",
//                 tier_sixty_eight: 0,
//                 tier_zero: 0,
//                 tier_seventy_six: 0,
//                 tier_thirty: 0,
//                 tier_fifty: 0,
//                 Professor: "",
//                 Audit: 9,
//                 tier_g_fifty: 0,
//                 tier_forty: 0,
//                 Withdrew: 1,
//                 Year: 20,
//                 tier_twenty: 0,
//                 Stddev: 2.65,
//                 Enrolled: 20,
//                 tier_fifty_five: 0,
//                 tier_eighty: 0,
//                 tier_sixty: 0,
//                 tier_ten: 0,
//                 High: 98,
//                 Course: "504",
//                 Session: "w",
//                 Pass: 9,
//                 Fail: 0,
//                 Avg: 94.44,
//                 Campus: "ubc",
//                 Subject: "aanb"
//             };
//             let ds: Dataset = new Dataset(id, kind, courses);
//             assert.isTrue(ds.hasAllRequiredFields(section));
//         });
//
//         it("should return false, section missing Subject field", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const courses: Course[] = [];
//             const section: object = {
//                 tier_eighty_five: 1,
//                 tier_ninety: 8,
//                 Title: "rsrch methdlgy",
//                 Section: "002",
//                 Detail: "",
//                 tier_seventy_two: 0,
//                 Other: 1,
//                 Low: 89,
//                 tier_sixty_four: 0,
//                 id: "31379",
//                 tier_sixty_eight: 0,
//                 tier_zero: 0,
//                 tier_seventy_six: 0,
//                 tier_thirty: 0,
//                 tier_fifty: 0,
//                 Professor: "",
//                 Audit: 9,
//                 tier_g_fifty: 0,
//                 tier_forty: 0,
//                 Withdrew: 1,
//                 Year: 20,
//                 tier_twenty: 0,
//                 Stddev: 2.65,
//                 Enrolled: 20,
//                 tier_fifty_five: 0,
//                 tier_eighty: 0,
//                 tier_sixty: 0,
//                 tier_ten: 0,
//                 High: 98,
//                 Course: "504",
//                 Session: "w",
//                 Pass: 9,
//                 Fail: 0,
//                 Avg: 94.44,
//                 Campus: "ubc",
//             };
//             let ds: Dataset = new Dataset(id, kind, courses);
//             assert.isFalse(ds.hasAllRequiredFields(section));
//         });
//     });
//
//     describe("propertiesHaveCorrectTypes tests", function () {
//         it("should return false, Year is typeof string instead of number", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const courses: Course[] = [];
//             const section: object = {
//                 tier_eighty_five: 1,
//                 tier_ninety: 8,
//                 Title: "rsrch methdlgy",
//                 Section: "002",
//                 Detail: "",
//                 tier_seventy_two: 0,
//                 Other: 1,
//                 Low: 89,
//                 tier_sixty_four: 0,
//                 id: "31379",
//                 tier_sixty_eight: 0,
//                 tier_zero: 0,
//                 tier_seventy_six: 0,
//                 tier_thirty: 0,
//                 tier_fifty: 0,
//                 Professor: "",
//                 Audit: 9,
//                 tier_g_fifty: 0,
//                 tier_forty: 0,
//                 Withdrew: 1,
//                 Year: "20",
//                 tier_twenty: 0,
//                 Stddev: 2.65,
//                 Enrolled: 20,
//                 tier_fifty_five: 0,
//                 tier_eighty: 0,
//                 tier_sixty: 0,
//                 tier_ten: 0,
//                 High: 98,
//                 Course: "552",
//                 Session: "w",
//                 Pass: 9,
//                 Fail: 0,
//                 Avg: 94.44,
//                 Campus: "ubc",
//                 Subject: "subject"
//             };
//             let ds: Dataset = new Dataset(id, kind, courses);
//             assert.isFalse(ds.propertiesHaveCorrectTypes(section));
//         });
//
//         it("should return false, Subject is boolean instead of string", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const courses: Course[] = [];
//             const section: object = {
//                 tier_eighty_five: 1,
//                 tier_ninety: 8,
//                 Title: "rsrch methdlgy",
//                 Section: "002",
//                 Detail: "",
//                 tier_seventy_two: 0,
//                 Other: 1,
//                 Low: 89,
//                 tier_sixty_four: 0,
//                 id: "31379",
//                 tier_sixty_eight: 0,
//                 tier_zero: 0,
//                 tier_seventy_six: 0,
//                 tier_thirty: 0,
//                 tier_fifty: 0,
//                 Professor: "",
//                 Audit: 9,
//                 tier_g_fifty: 0,
//                 tier_forty: 0,
//                 Withdrew: 1,
//                 Year: 20,
//                 tier_twenty: 0,
//                 Stddev: 2.65,
//                 Enrolled: 20,
//                 tier_fifty_five: 0,
//                 tier_eighty: 0,
//                 tier_sixty: 0,
//                 tier_ten: 0,
//                 High: 98,
//                 Course: "504",
//                 Session: "w",
//                 Pass: 9,
//                 Fail: 0,
//                 Avg: 94.44,
//                 Campus: "ubc",
//                 Subject: true
//             };
//             let ds: Dataset = new Dataset(id, kind, courses);
//             assert.isFalse(ds.propertiesHaveCorrectTypes(section));
//         });
//
//         it("should return true, all fields have correct types", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const courses: Course[] = [];
//             const section: object = {
//                 tier_eighty_five: 1,
//                 tier_ninety: 8,
//                 Title: "rsrch methdlgy",
//                 Section: "002",
//                 Detail: "",
//                 tier_seventy_two: 0,
//                 Other: 1,
//                 Low: 89,
//                 tier_sixty_four: 0,
//                 id: "31379",
//                 tier_sixty_eight: 0,
//                 tier_zero: 0,
//                 tier_seventy_six: 0,
//                 tier_thirty: 0,
//                 tier_fifty: 0,
//                 Professor: "",
//                 Audit: 9,
//                 tier_g_fifty: 0,
//                 tier_forty: 0,
//                 Withdrew: 1,
//                 Year: 20,
//                 tier_twenty: 0,
//                 Stddev: 2.65,
//                 Enrolled: 20,
//                 tier_fifty_five: 0,
//                 tier_eighty: 0,
//                 tier_sixty: 0,
//                 tier_ten: 0,
//                 High: 98,
//                 Course: "504",
//                 Session: "w",
//                 Pass: 9,
//                 Fail: 0,
//                 Avg: 94.44,
//                 Campus: "ubc",
//                 Subject: "subject"
//             };
//             let ds: Dataset = new Dataset(id, kind, courses);
//             assert.isTrue(ds.propertiesHaveCorrectTypes(section));
//         });
//     });
//
//     describe("formatFields tests", function () {
//         it("should do nothing true, all fields have correct types, section isn't overall", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const courses: Course[] = [];
//             const section: object = {
//                 tier_eighty_five: 1,
//                 tier_ninety: 8,
//                 Title: "rsrch methdlgy",
//                 Section: "002",
//                 Detail: "",
//                 tier_seventy_two: 0,
//                 Other: 1,
//                 Low: 89,
//                 tier_sixty_four: 0,
//                 id: "31379",
//                 tier_sixty_eight: 0,
//                 tier_zero: 0,
//                 tier_seventy_six: 0,
//                 tier_thirty: 0,
//                 tier_fifty: 0,
//                 Professor: "",
//                 Audit: 9,
//                 tier_g_fifty: 0,
//                 tier_forty: 0,
//                 Withdrew: 1,
//                 Year: 20,
//                 tier_twenty: 0,
//                 Stddev: 2.65,
//                 Enrolled: 20,
//                 tier_fifty_five: 0,
//                 tier_eighty: 0,
//                 tier_sixty: 0,
//                 tier_ten: 0,
//                 High: 98,
//                 Course: "504",
//                 Session: "w",
//                 Pass: 9,
//                 Fail: 0,
//                 Avg: 94.44,
//                 Campus: "ubc",
//                 Subject: "subject"
//             };
//             let ds: Dataset = new Dataset(id, kind, courses);
//             assert.equal(ds.formatFields(section), section);
//         });
//
//         it("should change year to 1900, section is overall", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const courses: Course[] = [];
//             const section: object = {
//                 tier_eighty_five: 1,
//                 tier_ninety: 8,
//                 Title: "rsrch methdlgy",
//                 Section: "overall",
//                 Detail: "",
//                 tier_seventy_two: 0,
//                 Other: 1,
//                 Low: 89,
//                 tier_sixty_four: 0,
//                 id: "31379",
//                 tier_sixty_eight: 0,
//                 tier_zero: 0,
//                 tier_seventy_six: 0,
//                 tier_thirty: 0,
//                 tier_fifty: 0,
//                 Professor: "",
//                 Audit: 9,
//                 tier_g_fifty: 0,
//                 tier_forty: 0,
//                 Withdrew: 1,
//                 Year: 20,
//                 tier_twenty: 0,
//                 Stddev: 2.65,
//                 Enrolled: 20,
//                 tier_fifty_five: 0,
//                 tier_eighty: 0,
//                 tier_sixty: 0,
//                 tier_ten: 0,
//                 High: 98,
//                 Course: "504",
//                 Session: "w",
//                 Pass: 9,
//                 Fail: 0,
//                 Avg: 94.44,
//                 Campus: "ubc",
//                 Subject: "subject"
//             };
//             let ds: Dataset = new Dataset(id, kind, courses);
//             let formattedYear: number = ds.formatFields(section)["Year"];
//             assert.strictEqual(formattedYear, 1900);
//         });
//
//         it("should change year from string to number", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const courses: Course[] = [];
//             const section: any = {
//                 tier_eighty_five: 1,
//                 tier_ninety: 8,
//                 Title: "rsrch methdlgy",
//                 Section: "002",
//                 Detail: "",
//                 tier_seventy_two: 0,
//                 Other: 1,
//                 Low: 89,
//                 tier_sixty_four: 0,
//                 id: "31379",
//                 tier_sixty_eight: 0,
//                 tier_zero: 0,
//                 tier_seventy_six: 0,
//                 tier_thirty: 0,
//                 tier_fifty: 0,
//                 Professor: "",
//                 Audit: 9,
//                 tier_g_fifty: 0,
//                 tier_forty: 0,
//                 Withdrew: 1,
//                 Year: 2020,
//                 tier_twenty: 0,
//                 Stddev: 2.65,
//                 Enrolled: 20,
//                 tier_fifty_five: 0,
//                 tier_eighty: 0,
//                 tier_sixty: 0,
//                 tier_ten: 0,
//                 High: 98,
//                 Course: "504",
//                 Session: "w",
//                 Pass: 9,
//                 Fail: 0,
//                 Avg: 94.44,
//                 Campus: "ubc",
//                 Subject: "subject"
//             };
//             let ds: Dataset = new Dataset(id, kind, courses);
//             let formattedYear: number = ds.formatFields(section)["Year"];
//             assert.strictEqual(formattedYear, 2020);
//         });
//
//         it("should change id from number to string", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const courses: Course[] = [];
//             const section: object = {
//                 tier_eighty_five: 1,
//                 tier_ninety: 8,
//                 Title: "rsrch methdlgy",
//                 Section: "overall",
//                 Detail: "",
//                 tier_seventy_two: 0,
//                 Other: 1,
//                 Low: 89,
//                 tier_sixty_four: 0,
//                 id: 31379,
//                 tier_sixty_eight: 0,
//                 tier_zero: 0,
//                 tier_seventy_six: 0,
//                 tier_thirty: 0,
//                 tier_fifty: 0,
//                 Professor: "",
//                 Audit: 9,
//                 tier_g_fifty: 0,
//                 tier_forty: 0,
//                 Withdrew: 1,
//                 Year: 20,
//                 tier_twenty: 0,
//                 Stddev: 2.65,
//                 Enrolled: 20,
//                 tier_fifty_five: 0,
//                 tier_eighty: 0,
//                 tier_sixty: 0,
//                 tier_ten: 0,
//                 High: 98,
//                 Course: "504",
//                 Session: "w",
//                 Pass: 9,
//                 Fail: 0,
//                 Avg: 94.44,
//                 Campus: "ubc",
//                 Subject: "subject"
//             };
//             let ds: Dataset = new Dataset(id, kind, courses);
//             let formattedId: string = ds.formatFields(section)["id"];
//             assert.strictEqual(formattedId, "31379");
//         });
//
//     });
//
//     describe("filterInvalidSections tests", function () {
//
//         it("should not filter any sections", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const content: string = datasets[id];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             return datasetHelper.readContent(content)
//                 .then((courses: Course[]) => {
//                     return new Dataset(id, kind, courses);
//                 })
//                 .then((ds: Dataset) => {
//                     ds.filterInvalidSections();
//                     return ds;
//                 })
//                 .then((ds: Dataset) => {
//                     expect(expectedCourses).to.deep.equal(ds.getCourses());
//                 })
//                 .catch((err: any) => {
//                     expect.fail(err, "should not have failed");
//                 });
//         });
//
//         it("should filter out first section, missing avg field", function () {
//             const id: string = "AAN";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const content: string = datasets[id];
//             let ds: Dataset = new Dataset(id, kind, coursesWithInvalidSection);
//             return ds.filterInvalidSections()
//                 .then((result: Dataset) => {
//                     expect(expectedCourses2).to.deep.equal(result.getCourses());
//                 })
//                 .catch((err: any) => {
//                     expect.fail(err, expectedCourses2, "should not have failed");
//                 });
//         });
//     });
// })
// ;
//
