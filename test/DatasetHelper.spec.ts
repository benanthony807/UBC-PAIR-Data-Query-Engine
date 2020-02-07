// import {InsightDatasetKind} from "../src/controller/IInsightFacade";
// import Log from "../src/Util";
// import Dataset from "../src/controller/Dataset";
// import DatasetHelper from "../src/controller/DatasetHelper";
// import Course from "../src/controller/Course";
// import InsightFacade from "../src/controller/InsightFacade";
// import * as fs from "fs-extra";
// import {expect} from "chai";
//
// let assert = require("chai").assert;
//
// export interface ITestQuery {
//     title: string;
//     query: any; // make any to allow testing structurally invalid queries
//     isQueryValid: boolean;
//     result: any;
//     filename: string; // This is injected when reading the file
// }
//
// let expectedDatasets: any = [{
//     id: "AAN", kind: "courses", courses: [{
//         result: [{
//             tier_eighty_five: 1,
//             tier_ninety: 8,
//             Title: "rsrch methdlgy",
//             Section: "002",
//             Detail: "",
//             tier_seventy_two: 0,
//             Other: 1,
//             Low: 89,
//             tier_sixty_four: 0,
//             id: "31379",
//             tier_sixty_eight: 0,
//             tier_zero: 0,
//             tier_seventy_six: 0,
//             tier_thirty: 0,
//             tier_fifty: 0,
//             Professor: "",
//             Audit: 9,
//             tier_g_fifty: 0,
//             tier_forty: 0,
//             Withdrew: 1,
//             Year: 2015,
//             tier_twenty: 0,
//             Stddev: 2.65,
//             Enrolled: 20,
//             tier_fifty_five: 0,
//             tier_eighty: 0,
//             tier_sixty: 0,
//             tier_ten: 0,
//             High: 98,
//             Course: "504",
//             Session: "w",
//             Pass: 9,
//             Fail: 0,
//             Avg: 94.44,
//             Campus: "ubc",
//             Subject: "aanb"
//         }, {
//             tier_eighty_five: 1,
//             tier_ninety: 8,
//             Title: "rsrch methdlgy",
//             Section: "overall",
//             Detail: "",
//             tier_seventy_two: 0,
//             Other: 1,
//             Low: 89,
//             tier_sixty_four: 0,
//             id: "31380",
//             tier_sixty_eight: 0,
//             tier_zero: 0,
//             tier_seventy_six: 0,
//             tier_thirty: 0,
//             tier_fifty: 0,
//             Professor: "",
//             Audit: 9,
//             tier_g_fifty: 0,
//             tier_forty: 0,
//             Withdrew: 1,
//             Year: 1900,
//             tier_twenty: 0,
//             Stddev: 2.65,
//             Enrolled: 20,
//             tier_fifty_five: 0,
//             tier_eighty: 0,
//             tier_sixty: 0,
//             tier_ten: 0,
//             High: 98,
//             Course: "504",
//             Session: "w",
//             Pass: 9,
//             Fail: 0,
//             Avg: 94.44,
//             Campus: "ubc",
//             Subject: "aanb"
//         }], rank: 0
//     }]
// }];
//
// describe("InsightFacade Add/Remove Dataset", function () {
//     // Reference any datasets you've added to test/data here and they will
//     // automatically be loaded in the 'before' hook.
//     const datasetsToLoad: { [id: string]: string } = {
//         courses: "./test/data/courses.zip",
//         empty: "./test/data/empty.zip",
//         onecourseemptyjson: "./test/data/onecourseemptyjson.zip",
//         onecoursenosections: "./test/data/onecoursenosections.zip",
//         duplicatecourse: "./test/data/duplicatecourse.zip",
//         nocoursesfolder: "./test/data/nocoursesfolder.zip",
//         onevalidfileothersnot: "./test/data/onevalidfileothersnot.zip",
//         valid1course: "./test/data/valid1course.zip",
//         AAN: "./test/data/AAN.zip",
//         notazip: "./test/data/notazip.txt"
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
//         insightFacade = new InsightFacade();
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
//             // fs.unlinkSync("data/datasets.txt");
//         } catch (err) {
//             // Log.error(err);
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
//     describe("idValid tests", function () {
//         it("should accept a valid id", function () {
//             const id: string = "validid";
//             const ds: Dataset[] = [];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             return assert.isTrue(datasetHelper.idValid(id));
//         });
//
//         it("should reject invalid id: contains underscore", function () {
//             const id: string = "_invalid";
//             const ds: Dataset[] = [];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             return assert.isFalse(datasetHelper.idValid(id));
//         });
//
//         it("should reject invalid id: contains only whitespace: space", function () {
//             const id: string = " ";
//             const ds: Dataset[] = [];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             return assert.isFalse(datasetHelper.idValid(id));
//         });
//
//         it("should reject invalid id: contains only whitespace: tab", function () {
//             const id: string = "    ";
//             const ds: Dataset[] = [];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             return assert.isFalse(datasetHelper.idValid(id));
//         });
//     });
//
//     describe("idInDatasets tests", function () {
//         it("should reject: id already exists in ds", function () {
//             const id: string = "courses";
//             const courses: Course[] = [];
//             const dataset: Dataset = new Dataset("courses", InsightDatasetKind.Courses, courses);
//             const ds: Dataset[] = [dataset];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             return assert.isTrue(datasetHelper.idInDatasets(id, ds));
//         });
//
//         it("should reject invalid id: id already exists in ds, second item in array", function () {
//             const id: string = "valid2";
//             const courses: Course[] = [];
//             const dataset1: Dataset = new Dataset("valid1", InsightDatasetKind.Courses, courses);
//             const dataset2: Dataset = new Dataset("valid2", InsightDatasetKind.Courses, courses);
//             const ds: Dataset[] = [dataset1, dataset2];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             return assert.isTrue(datasetHelper.idInDatasets(id, ds));
//         });
//     });
//
//
//     describe("diagnoseIssue tests", function () {
//         it("should return string: \"id invalid: contains underscore\"", function () {
//             const id: string = "invalid_";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const ds: Dataset[] = [];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             const result: string = "id invalid: contains underscore";
//
//             return assert.deepEqual(result, datasetHelper.diagnoseIssue(id, kind, ds));
//         });
//
//         it("should return string: \"id invalid: contains only whitespace characters\"", function () {
//             const id: string = " ";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const ds: Dataset[] = [];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             const result: string = "id invalid: contains only whitespace characters";
//
//             return assert.deepEqual(result, datasetHelper.diagnoseIssue(id, kind, ds));
//         });
//
//         it("should return string: \"id invalid: contains only whitespace characters\"", function () {
//             const id: string = "    ";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const ds: Dataset[] = [];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             const result: string = "id invalid: contains only whitespace characters";
//
//             return assert.deepEqual(result, datasetHelper.diagnoseIssue(id, kind, ds));
//         });
//
//         it("should return string: \"kind invalid: rooms is not allowed\"", function () {
//             const id: string = "valid";
//             const kind: InsightDatasetKind = InsightDatasetKind.Rooms;
//             const ds: Dataset[] = [];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             const result: string = "kind invalid: rooms is not allowed";
//
//             return assert.deepEqual(result, datasetHelper.diagnoseIssue(id, kind, ds));
//         });
//
//         it("should return string: \"dataset invalid: dataset with same id already added\"", function () {
//             const id: string = "valid";
//             const kind: InsightDatasetKind = InsightDatasetKind.Courses;
//             const courses: Course[] = [];
//             const dataset: Dataset = new Dataset("valid", InsightDatasetKind.Courses, courses);
//             const ds: Dataset[] = [dataset];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//             const result: string = "dataset invalid: dataset with same id already added";
//
//             return assert.deepEqual(result, datasetHelper.diagnoseIssue(id, kind, ds));
//         });
//     });
//
//     describe("getIds tests", function () {
//         it("should return empty array", function () {
//             const ds: Dataset[] = [];
//             const result: string[] = [];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//
//             return assert.deepEqual(result, datasetHelper.getIds(ds));
//         });
//
//         it("should return array with 2 ids", function () {
//             const courses: Course[] = [];
//             const dataset1: Dataset = new Dataset("valid1", InsightDatasetKind.Courses, courses);
//             const dataset2: Dataset = new Dataset("valid2", InsightDatasetKind.Courses, courses);
//             const ds: Dataset[] = [dataset1, dataset2];
//             const result: string[] = ["valid1", "valid2"];
//             const datasetHelper: DatasetHelper = new DatasetHelper();
//
//             return assert.deepEqual(result, datasetHelper.getIds(ds));
//         });
//     });
//
//     describe("read/write tests", function () {
//         it("should read an existing dataset", function () {
//                 const id: string = "AAN";
//                 const expected: string[] = [id];
//                 const datasetHelper: DatasetHelper = new DatasetHelper();
//                 return insightFacade
//                     .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//                     .then((result: string[]) => {
//                         expect(datasetHelper.readDatasets()).to.deep.equal(expectedDatasets);
//                     })
//                     .catch((err: any) => {
//                         expect.fail(err, expected, "Should not have rejected");
//                     });
//         });
//     });
// });
