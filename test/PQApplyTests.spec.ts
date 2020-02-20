import InsightFacade from "../src/controller/InsightFacade";
import PQPreQuery from "../src/controller/PQPreQuery";
import PQRunQuery from "../src/controller/PQRunQuery";
import Log from "../src/Util";
import * as assert from "assert";

describe("Apply Tests", function () {
    let insightFacade: InsightFacade = new InsightFacade();
    let preQuery: PQPreQuery = new PQPreQuery();
    let runQuery: PQRunQuery = new PQRunQuery();

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });
    let S1 = { "courses_uuid": "1", "courses_instructor": "Jean",  "courses_avg": 90, "courses_title" : "310"};
    let S2 = { "courses_uuid": "2", "courses_instructor": "Jean",  "courses_avg": 80, "courses_title" : "310"};
    let S3 = { "courses_uuid": "3", "courses_instructor": "Casey", "courses_avg": 95, "courses_title" : "310"};
    let S4 = { "courses_uuid": "4", "courses_instructor": "Casey", "courses_avg": 85, "courses_title" : "310"};
    let S5 = { "courses_uuid": "5", "courses_instructor": "Kelly", "courses_avg": 74, "courses_title" : "210"};
    let S6 = { "courses_uuid": "6", "courses_instructor": "Kelly", "courses_avg": 78, "courses_title" : "210"};
    let S7 = { "courses_uuid": "7", "courses_instructor": "Kelly", "courses_avg": 72, "courses_title" : "210"};
    let S8 = { "courses_uuid": "8", "courses_instructor": "Eli",   "courses_avg": 85, "courses_title" : "210"};

    let mockSections = [ S1, S2, S3, S4, S5, S6, S7, S8 ];

    // TESTS FOR SYNTAX/SEMANTICS ================================================================

    // TESTS FOR TRANSFORMATIONS ================================================================
    it("Accept: Normal Grammar", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                                    "APPLY": [ { "overallAvg": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.isTransformationsvalid(query), true);
    });
    it("Reject: Transformations only has 1 key", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ] } };
        assert.equal(preQuery.isTransformationsvalid(query), false);
    });
    it("Reject: Transformations only has 2 keys but misspelled", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                                     "APP": [ { "overallAvg": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.isTransformationsvalid(query), false);
    });

    // TESTS FOR GROUP ================================================================
    it("Accept: GROUP is valid - one item", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                                    "APPLY": [ { "overallAvg": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.isGroupValid(query), true);
    });
    it("Accept: GROUP is valid - two items", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title", "courses_avg" ],
                                    "APPLY": [ { "overallAvg": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.isGroupValid(query), true);
    });
    it("Reject: GROUP is empty", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [],
                                    "APPLY": [ { "overallAvg": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.isGroupValid(query), false);
    });

    // TESTS FOR APPLY ================================================================

    // CHECK COLUMNS SEMANTICS ==============
    it("Accept: COLUMN items in APPLY", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                "APPLY": [  { "overallAvg": { "AVG": "courses_avg" } },
                            { "hello": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.checkColumnSemantics(query), true);
    });
    it("Reject: COLUMN item not in APPLY", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "notInApply" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                "APPLY": [  { "overallAvg": { "AVG": "courses_avg" } },
                    { "hello": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.checkColumnSemantics(query), false);
    });
    it("Accept: COLUMN only has 'hello', which is in APPLY", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "hello" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                "APPLY": [  { "overallAvg": { "AVG": "courses_avg" } },
                    { "hello": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.checkColumnSemantics(query), true);
    });
    it("Accept: COLUMN only has 'courses_title', which is in GROUP", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                "APPLY": [  { "overallAvg": { "AVG": "courses_avg" } },
                            { "hello": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.checkColumnSemantics(query), true);
    });

    // CHECK APPLY SYNTAX ==============
    it("Accept: Normal APPLY with one key", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                                    "APPLY": [ { "overallAvg": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.isApplyValid(query), true);
    });
    it("Reject: Apply is object, should be an array", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                                    "APPLY":  { "overallAvg": { "AVG": "courses_avg" } } } };
        assert.equal(preQuery.isApplyValid(query), false);
    });
    it("Reject: Apply is empty array, should not be empty array", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                                    "APPLY": [] } };
        assert.equal(preQuery.isApplyValid(query), false);
    });
    it("Reject: Apply key has _, should not have _", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                                    "APPLY": [  { "overallAvg": { "AVG": "courses_avg" } },
                                                { "overall_Avg": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.isApplyValid(query), false);
    });
    it("Reject: Apply key has duplicate, should not have duplicate", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                                    "APPLY": [  { "overallAvg": { "AVG": "courses_avg" } },
                                                { "overallAvg": { "AVG": "courses_avg" } } ] } };
        assert.equal(preQuery.isApplyValid(query), false);
    });
    it("Reject: Apply key's key isn't MAX/MIN/SUM/AVG/COUNT", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                                    "APPLY": [  { "overallAvg": { "AVG": "courses_avg" } },
                                                { "hello": { "HI": "courses_avg" } } ] } };
        assert.equal(preQuery.isApplyValid(query), false);
    });
    it("Reject: Apply key's item is not an object, should be object", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                                    "APPLY": [  {"overallAvg": [] } ] } };
        assert.equal(preQuery.isApplyValid(query), false);
    });
    it("Reject: APPLY's grandchild is an empty object, should not be empty", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                                    "APPLY": [  { "overallAvg": { } } ] } };
        assert.equal(preQuery.isApplyValid(query), false);
    });
    it("Reject: APPLY's grandchild value is semantically invalid, should be type number", function () {
        let query = {
            "WHERE": {},
            "OPTIONS": { "COLUMNS": [ "courses_title", "overallAvg" ] },
            "TRANSFORMATIONS": {    "GROUP": [ "courses_title" ],
                "APPLY": [  { "overallAvg": { "AVG": "courses_dept" } } ] } };
        assert.equal(preQuery.isApplyValid(query), false);
    });

});
