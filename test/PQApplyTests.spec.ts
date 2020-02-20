import InsightFacade from "../src/controller/InsightFacade";
import PQPreQSyntax from "../src/controller/PQPreQSyntax";
import PQRunQuery from "../src/controller/PQRunQuery";
import Log from "../src/Util";
import * as assert from "assert";
import PQTransformer from "../src/controller/PQTransformer";
import PQPreQTransfChecker from "../src/controller/PQPreQTransfChecker";

describe("Apply Tests", function () {
    let insightFacade: InsightFacade = new InsightFacade();
    let preQuery: PQPreQSyntax = new PQPreQSyntax();
    let runQuery: PQRunQuery = new PQRunQuery();
    let transformer: PQTransformer = new PQTransformer();
    let transfChecker: PQPreQTransfChecker = new PQPreQTransfChecker();

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });
    let S1 = { courses_uuid: "1", courses_instructor: "Jean",  courses_avg: 90, courses_title : "310"};
    let S2 = { courses_uuid: "2", courses_instructor: "Jean",  courses_avg: 80, courses_title : "310"};
    let S3 = { courses_uuid: "3", courses_instructor: "Casey", courses_avg: 95, courses_title : "310"};
    let S4 = { courses_uuid: "4", courses_instructor: "Casey", courses_avg: 85, courses_title : "310"};
    let S5 = { courses_uuid: "5", courses_instructor: "Kelly", courses_avg: 74, courses_title : "210"};
    let S6 = { courses_uuid: "6", courses_instructor: "Kelly", courses_avg: 78, courses_title : "210"};
    let S7 = { courses_uuid: "7", courses_instructor: "Kelly", courses_avg: 72, courses_title : "210"};
    let S8 = { courses_uuid: "8", courses_instructor: "Eli",   courses_avg: 85, courses_title : "210"};

    let mockSections = [ S1, S2, S3, S4, S5, S6, S7, S8 ];

    // TESTS FOR TRANSFORMATIONS ================================================================
    it("Accept: Normal Grammar", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [ { overallAvg: { AVG: "courses_avg" } } ] } };
        assert.equal(transfChecker.isTransformationsValid(query), true);
    });
    it("Reject: Transformations only has 1 key", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ] } };
        assert.equal(transfChecker.isTransformationsValid(query), "TRANSFORMATIONS must have 2 keys");
    });
    it("Reject: Transformations only has 2 keys but misspelled", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                     APP: [ { overallAvg: { AVG: "courses_avg" } } ] } };
        let expected = "The two keys of TRANSFORMATIONS must be GROUP and APPLY";
        assert.equal(transfChecker.isTransformationsValid(query), expected);
    });

    // CHECK APPLY SYNTAX/SEMANTICS ==============
    it("Accept: Normal APPLY with one key", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [ { overallAvg: { AVG: "courses_avg" } } ] } };
        assert.equal(transfChecker.isApplyValid(query), true);
    });
    it("Reject: Apply is object, should be an array", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY:  { overallAvg: { AVG: "courses_avg" } } } };
        assert.equal(transfChecker.isApplyValid(query), false);
    });
    // // Commented out for yarn build/commits because of empty []
    // it("Reject: Apply is empty array, should not be empty array", function () {
    //     let query = {
    //         WHERE: {},
    //         OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
    //         TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
    //                                 APPLY: [] } };
    //     assert.equal(transfChecker.isApplyValid(query), false);
    // });
    it("Reject: Apply key has _, should not have _", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [  { overallAvg: { AVG: "courses_avg" } },
                                                { overall_Avg: { AVG: "courses_avg" } } ] } };
        assert.equal(transfChecker.isApplyValid(query), false);
    });
    it("Reject: Apply key has duplicate, should not have duplicate", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [  { overallAvg: { AVG: "courses_avg" } },
                                                { overallAvg: { AVG: "courses_avg" } } ] } };
        assert.equal(transfChecker.isApplyValid(query), false);
    });
    it("Reject: Apply key's key isn't MAX/MIN/SUM/AVG/COUNT", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [  { overallAvg: { AVG: "courses_avg" } },
                                                { hello: { HI: "courses_avg" } } ] } };
        assert.equal(transfChecker.isApplyValid(query), false);
    });
    // // Commented out for yarn build/commits because of empty []
    // it("Reject: Apply key's item is not an object, should be object", function () {
    //     let query = {
    //         WHERE: {},
    //         OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
    //         TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
    //                                 APPLY: [  {overallAvg: [] } ] } };
    //     assert.equal(transfChecker.isApplyValid(query), false);
    // });
    it("Reject: APPLY's grandchild is an empty object, should not be empty", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [  { overallAvg: { } } ] } };
        assert.equal(transfChecker.isApplyValid(query), false);
    });
    it("Reject: APPLY's grandchild value is semantically invalid, should be type number", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [  { overallAvg: { AVG: "courses_dept" } } ] } };
        assert.equal(transfChecker.isApplyValid(query), false);
    });
    it("Reject: APPLY references multiple datasets", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [  { overallAvg: { AVG: "courses_avg" } },
                                                { hello: { AVG: "cour_avg" } }] } };
        assert.equal(transfChecker.isApplyValid(query), false);
    });
    it("Reject: APPLY grandchild value is not a valid key", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [ { overallAvg: { AVG: "courses_bobloblaw" } } ] } };
        assert.equal(transfChecker.isApplyValid(query), false);
    });

    // CHECK APPLY FUNCTION ==============
    it("Accept: APPLY with AVG", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [  { overallAvg: { AVG: "courses_avg" } } ] } };
        let expected = [
            { courses_title : "310", overallAvg: 87.5},
            { courses_title : "210", overallAvg: 77.25},
        ];
        assert.equal(transformer.doTransformation(mockSections, query), true);
    });
});
