import InsightFacade from "../src/controller/InsightFacade";
import PQPreQSyntax from "../src/controller/PQPreQSyntax";
import PQRunQuery from "../src/controller/PQRunQuery";
import Log from "../src/Util";
import * as assert from "assert";
import PQTransformer from "../src/controller/PQTransformer";
import PQPreQTransfChecker from "../src/controller/PQPreQTransfChecker";

describe("Group Tests", function () {
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

    // TESTS FOR GROUP SYNTAX================================================================

    it("Accept: GROUP is valid - one item", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [ { overallAvg: { AVG: "courses_avg" } } ] } };
        assert.equal(transfChecker.isGroupValid(query), true);
    });
    it("Accept: GROUP is valid - two items", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title", "courses_avg" ],
                                    APPLY: [ { overallAvg: { AVG: "courses_avg" } } ] } };
        assert.equal(transfChecker.isGroupValid(query), true);
    });
    // // Commented out for yarn build/commits because of empty []
    // it("Reject: GROUP is empty", function () {
    //     let query = {
    //         WHERE: {},
    //         OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
    //         TRANSFORMATIONS: {    GROUP: [],
    //                                 APPLY: [ { overallAvg: { AVG: "courses_avg" } } ] } };
    //     assert.equal(transfChecker.isGroupValid(query), false);
    // });
    it("Reject: GROUP isn't a list", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: {},
                APPLY: [ { overallAvg: { AVG: "courses_avg" } } ] } };
        assert.equal(transfChecker.isGroupValid(query), false);
    });

    // TESTS FOR GROUP SEMANTICS ================================================================

    it("Reject: id_field item in GROUP has invalid field", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title", "courses_bobloblaw" ],
                                    APPLY: [ { overallAvg: { AVG: "courses_avg" } } ] } };
        assert.equal(transfChecker.isGroupValid(query), false);
    });
    it("Reject: GROUP references multiple datasets", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title", "cour_dept" ],
                                    APPLY: [ { overallAvg: { AVG: "courses_avg" } } ] } };
        assert.equal(transfChecker.isGroupValid(query), false);
    });

    // TESTS FOR GROUP FUNCTION ================================================================
    it("Accept: GROUP by course title", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [ { overallAvg: { AVG: "courses_avg" } } ] } };
        let expected = [ [S1, S2, S3, S4], [S5, S6, S7, S8] ]; // S1-S4 are "courses_title": "310"
        let expectedLength = Object.keys(expected).length;
        let actual = transformer.doGroup(mockSections, query);
        let actualLength = Object.keys(actual).length;
        // assert.equal(actual, expected);
        assert.equal(actualLength, expectedLength);
    });
    it("Accept: GROUP by course title and instructor", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title", "courses_instructor" ],
                APPLY: [ { overallAvg: { AVG: "courses_avg" } } ] } };
        let expected = [ [S1, S2], [S3, S4], [S5, S6, S7], [S8] ]; // S1-S4 are "courses_title": "310"
        let expectedLength = Object.keys(expected).length;
        let actual = transformer.doGroup(mockSections, query);
        let actualLength = Object.keys(actual).length;
        // assert.equal(actual, expected);
        assert.equal(actualLength, expectedLength);
        // assert.equal(transformer.doGroup(mockSections, query), expected);
    });

});
