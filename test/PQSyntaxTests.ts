// import PQPreQSyntax from "../src/controller/PQPreQSyntax";
// import Log from "../src/Util";
// import InsightFacade from "../src/controller/InsightFacade";
// import * as assert from "assert";
// import PQRunQuery from "../src/controller/PQRunQuery";
// import PQPreQSemantics from "../src/controller/PQPreQSemantics";
//
// describe("Syntax Tests", function () {
//     let insightFacade: InsightFacade = new InsightFacade();
//     let syntaxChecker: PQPreQSyntax = new PQPreQSyntax();
//     let semanticsChecker: PQPreQSemantics = new PQPreQSemantics();
//     let runQuery: PQRunQuery = new PQRunQuery();
//
//     beforeEach(function () {
//         Log.test(`BeforeTest: ${this.currentTest.title}`);
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
// // TESTS FOR ONE ORDER ================================================================
//     it("Accept: Valid simple query 2 queue length", function () {
//         let query = {
//             WHERE: {GT: {courses_avg: 97}},
//             OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: "courses_avg"}};
//         assert.equal(syntaxChecker.isInputQueryValid(query), true);
//     });
//     it("Accept: Valid simple query 2 length- different order", function () {
//         let query = {
//             OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: "courses_avg"},
//             WHERE: {GT: {courses_avg: 97}} };
//         assert.equal(syntaxChecker.isInputQueryValid(query), true);
//     });
//     it("Accept: Valid simple query 3 length- normal order", function () {
//         let query = { "WHERE": { "GT": { "courses_avg": 97 } },
//             "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
//             "TRANSFORMATIONS": { "GROUP": [ "courses_title" ],
//                                  "APPLY": [ { "overallAvg": { "AVG": "courses_avg" } } ] } };
//         assert.equal(syntaxChecker.isInputQueryValid(query), true);
//     });
//     it("Accept: Valid simple query 3 length- different order", function () {
//         let query = {
//             "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
//             "WHERE": { "GT": { "courses_avg": 97 } },
//             "TRANSFORMATIONS": { "GROUP": [ "courses_title" ],
//                 "APPLY": [ { "overallAvg": { "AVG": "courses_avg" } } ] } };
//         assert.equal(syntaxChecker.isInputQueryValid(query), true);
//     });
//
//
//     it("Accept: COLUMNS-ORDER FLIPPED", function () {
//         let query = {
//             "WHERE": {
//                 "GT": {
//                     "courses_avg": 98.7
//                 }
//             },
//             "OPTIONS": {
//
//                 "ORDER": {
//                     "dir": "UP",
//                     "keys": [
//                         "courses_avg"
//                     ]
//                 },
//                 "COLUMNS": [
//                     "courses_dept",
//                     "courses_avg"
//                 ]
//             }
//         };
//         assert.equal(syntaxChecker.isInputQueryValid(query), true);
//     });
//
//     it("Reject: dir but not keys", function () {
//         let query = {
//             "WHERE": {
//                 "GT": {
//                     "courses_avg": 98.7
//                 }
//             },
//             "OPTIONS": {
//
//                 "ORDER": {
//                     "ke": [
//                         "courses_avg"
//                     ],
//                     "dir": "UP"
//                 },
//                 "COLUMNS": [
//                     "courses_dept",
//                     "courses_avg"
//                 ]
//             }
//         };
//         assert.equal(syntaxChecker.isInputQueryValid(query), "Order key must have dir and key");
//     });
//
//     it("Accept: dir-keys flipped", function () {
//         let query = {
//             "WHERE": {
//                 "GT": {
//                     "courses_avg": 98.7
//                 }
//             },
//             "OPTIONS": {
//
//                 "ORDER": {
//                     "keys": [
//                         "courses_avg"
//                     ],
//                     "dir": "UP"
//                 },
//                 "COLUMNS": [
//                     "courses_dept",
//                     "courses_avg"
//                 ]
//             }
//         };
//         assert.equal(syntaxChecker.isInputQueryValid(query), true);
//     });
//
//     it("Accept: GROUP-APPLY flipped", function () {
//         let query = {
//             "OPTIONS": {
//                 "COLUMNS": [
//                     "courses_title",
//                     "overallAvg"
//                 ]
//             },
//             "WHERE": {
//                 "GT": {
//                     "courses_avg": 97
//                 }
//             },
//             "TRANSFORMATIONS": {
//
//                 "APPLY": [
//                     {
//                         "overallAvg": {
//                             "AVG": "courses_avg"
//                         }
//                     }
//                 ],
//                 "GROUP": [
//                     "courses_title"
//                 ]
//             }
//         };
//         assert.equal(syntaxChecker.isInputQueryValid(query), true);
//     });
//
//     it("Accept: everything flipped", function () {
//         let query = {
//             "WHERE": {
//                 "GT": {
//                     "courses_avg": 97
//                 }
//             },
//             "OPTIONS": {
//                 "ORDER": {
//                     "keys": [
//                         "courses_avg"
//                     ],
//                     "dir": "UP"
//                 },
//                 "COLUMNS": [
//                     "courses_title",
//                     "overallAvg",
//                     "courses_avg"
//                 ]
//             },
//             "TRANSFORMATIONS": {
//                 "GROUP": [
//                     "courses_title",
//                     "courses_avg"
//                 ],
//                 "APPLY": [
//                     {
//                         "overallAvg": {
//                             "COUNT": "courses_avg"
//                         }
//                     }
//                 ]
//             }
//         };
//         assert.equal(syntaxChecker.isInputQueryValid(query), true);
//     });
//
//
//
// });
