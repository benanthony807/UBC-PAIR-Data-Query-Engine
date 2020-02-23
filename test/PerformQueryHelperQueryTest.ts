// import InsightFacade from "../src/controller/InsightFacade";
// import PQRunQuery from "../src/controller/PQRunQuery";
// import Log from "../src/Util";
// import * as assert from "assert";
// import PerformQueryHelperQueryHelper from "../src/controller/PerformQueryHelperQueryHelper";
// import {IInsightFacade, InsightDatasetKind} from "../src/controller/IInsightFacade";
// import Dataset from "../src/controller/Dataset";
// import PQPreQSyntax from "../src/controller/PQPreQSyntax";
//
// describe("InsightFacade Perform Query Helper Methods", function () {
//     let insightFacade: InsightFacade = new InsightFacade();
//     let performQueryHelper: PQRunQuery = new PQRunQuery();
//     let performQueryHelperQH: PerformQueryHelperQueryHelper = new PerformQueryHelperQueryHelper();
//     let performQueryHelperPreQuery: PQPreQSyntax = new PQPreQSyntax();
//
//     const datasetsToLoad: { [id: string]: string } = {
//         courses: "./test/data/courses.zip",
//     };
//     let datasets: { [id: string]: string } = {};
//     const cacheDir = __dirname + "/../data";
//
//     before(function () {
//         const id: string = "courses";
//         insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//     });
//
//     beforeEach(function () {
//         Log.test(`BeforeTest: ${this.currentTest.title}`);
//
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
//     describe("Tests to check NOT function", function () {
//         it("Reject: NOT has no key", function () {
//             let query = {WHERE: {NOT: {}}};
//             assert.equal(performQueryHelper.doFilter(query["WHERE"]), "NOT should only have 1 key, has 0");
//         });
//
//     });
//
//     describe("Tests to check AND function", function () {
//         it("Reject: AND is empty", function () {
//             let query = {WHERE: {AND: {}}};
//             assert.equal(performQueryHelper.doFilter(query["WHERE"]), "AND must be a non-empty array");
//         });
//
//         it("Accept: AND with same thing three times", function () {
//             let query = {
//                     AND: [{IS: {courses_id: "*123"}},
//                         {IS: {courses_id: "*123"}},
//                         {IS: {courses_id: "*123"}}]
//             };
//             let result = performQueryHelper.doFilter(query);
//             let bool = (Array.isArray(result) && result.length === 0);
//             assert.equal(bool, true);
//         });
//     });
//     // this will not run in general testing, must specifically click the arrow on the left
//     // describe("Tests to check IS function", function () {
//     //     it("Accept w Empty: IS has two keys", function () {
//     //         let query = {WHERE: {IS: {courses_dept: "hi", courses_dept: "ho"},}};
//     //         assert.equal(performQueryHelper.doFilter(query["WHERE"]), []);
//     //     });
//     // });
//
//     describe("Tests for Helper Functions", function () {
//         it("Accept: Able to isolate current key and compare to dataset key", function () {
//             let query = {GT: {courses_avg: 90}};
//             let currKeyVal = Object.keys(query["GT"])[0]; // ex. courses_avg
//             assert.equal(currKeyVal, "courses_avg");
//             let currKey = currKeyVal.substring(0, currKeyVal.indexOf("_")); // isolates the id, ex. "courses"
//             assert.equal(currKey, "courses");
//             if (currKey !== "courses") { // okay to assume this dataSetId is one of the loaded courses in datset
//                 return "Cannot query more than one dataset";
//             }
//         });
//         it("Reject: Different keys", function () {
//             let query = {GT: {courses_avg: 90}};
//             let currKeyVal = Object.keys(query["GT"])[0]; // ex. courses_avg
//             assert.equal(currKeyVal, "courses_avg");
//             let currKey = currKeyVal.substring(0, currKeyVal.indexOf("_")); // isolates the id, ex. "courses"
//             assert.equal(currKey, "courses");
//             let answer = "";
//             if (currKey !== "notCourses") { // okay to assume this dataSetId is one of the loaded courses in datset
//                  answer = "Cannot query more than one dataset";
//             }
//             assert.equal(answer, "Cannot query more than one dataset");
//         });
//     });
//
//     // describe("Tests to check ORDER function", function () {
//     //     it("Order a short list of sections", function () {
//     //         let query = {
//     //             WHERE: { NOT: { NOT: [ {GT: { courses_avg: 90} }, ] } },
//     //             OPTIONS: { COLUMNS: ["courses_avg"], ORDER: "courses_avg"}
//     //         };
//     //         let s2 = {courses_avg: 2};
//     //         let s3 = {courses_avg: 3};
//     //         let s1 = {courses_avg: 1};
//     //         let unsortedListOfSections = [s2, s3, s1];
//     //         let expected = [s1, s2, s3];
//     //         assert.equal(performQueryHelperQH.doOrder(unsortedListOfSections, query), expected);
//     //     });
//     // });
//
//     describe("Tests to check keyType", function () {
//         it("Reject: invalid key type in EQ", function () {
//             let query = {WHERE: {EQ: {courses_dept: "aanb"}}};
//             assert.equal(performQueryHelperQH.isKeyTypeAppropriate
//             (Object.keys(query["WHERE"]["EQ"])[0], "EQ"), false);
//         });
//         it("Accept: invalid key type in EQ", function () {
//             let query = {WHERE: {EQ: {courses_avg: 97}}};
//             assert.equal(performQueryHelperQH.isKeyTypeAppropriate
//             (Object.keys(query["WHERE"]["EQ"])[0], "EQ"), true);
//         });
//
//     });
//
// });
