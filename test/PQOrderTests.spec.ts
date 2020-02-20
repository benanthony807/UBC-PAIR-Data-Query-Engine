import PQPreQuery from "../src/controller/PQPreQuery";
import Log from "../src/Util";
import InsightFacade from "../src/controller/InsightFacade";
import * as assert from "assert";
import PQRunQuery from "../src/controller/PQRunQuery";

describe("Order Tests", function () {
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

// TESTS FOR ONE ORDER ================================================================
    it("Reject: ORDER key is not called ORDER", function () {
        let query = {
            WHERE: {GT: {courses_avg: 97}},
            OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDE: "courses_avg"}};
        assert.equal(preQuery.isOrderValid(query), false);
    });
    it("Reject: ORDER key has no fields", function () {
        let query = {
            WHERE: {GT: {courses_avg: 97}},
            OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: {}}};
        assert.equal(preQuery.isOrderValid(query), false);

    });

    it("Reject: ORDER key not a string", function () {
        let query = {
            WHERE: {GT: {courses_avg: 97}},
            OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: 1}
        };
        assert.equal(preQuery.isOrderValid(query), false);
    });
    it("Reject: ORDER value not in COLUMNS", function () {
        let query = {
            WHERE: {GT: {courses_avg: 97}},
            OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: "courses_id"}
        };
        assert.equal(preQuery.isOrderValid(query), false);
    });

// TESTS FOR TWO ORDER ================================================================

    // SYNTAX ================================================================
    it("Accept: two keys in orders dir and keys", function () {
        let query = {   WHERE: {    GT: { courses_avg: 98.7 } },
                        OPTIONS: {  COLUMNS:    [ "courses_dept", "courses_avg" ],
                                    ORDER:      {   dir: "DOWN",
                                                    keys: ["courses_avg"] } } };
        assert.equal(preQuery.isOrderValid(query), true);
    });
    it("Accept: multiple keys in ORDER->Keys", function () {
        let query = {   WHERE: {    GT: { courses_avg: 98.7 } },
            OPTIONS: {  COLUMNS:    [ "courses_dept", "courses_avg" ],
                ORDER:      {   dir: "DOWN",
                    keys: ["courses_dept", "courses_avg"] } } };
        assert.equal(preQuery.isOrderValid(query), true);
    });
    it("Reject: keys value is not in COLUMNS", function () {
        let query = {   WHERE: {    GT: { courses_avg: 98.7 } },
                        OPTIONS: {  COLUMNS:    [ "courses_dept", "courses_avg" ],
                                    ORDER:      {   dir: "DOWN",
                                                    keys: ["courses_dept", "courses_av"] } } };
        assert.equal(preQuery.isOrderValid(query), false);
    });

    // SEMANTICS ================================================================
    it("Accept: Two keys in keys", function () {
        let query = {   WHERE: {    GT: { courses_avg: 98.7 } },
                        OPTIONS: {  COLUMNS:    [ "courses_dept", "courses_avg" ],
                                    ORDER:      {   dir: "DOWN",
                                                    keys: ["courses_dept", "courses_avg"] } } };
        assert.equal(preQuery.areColumnAndOrderKeysValid(query), true);
    });
    it("Reject: Multiple datasets referenced", function () {
        let query = {   WHERE: {    GT: { courses_avg: 98.7 } },
                        OPTIONS: {  COLUMNS:    [ "courses_dept", "courses_avg" ],
                                    ORDER:      {   dir: "DOWN",
                                                    keys: ["courses_dept", "cours_avg"] } } };
        assert.equal(preQuery.areColumnAndOrderKeysValid(query), false);
    });

    // SORTING AND TIE BREAKING ==================================================
    let S1 = { courses_title: "S1", courses_avg: 90, courses_dept: "aanb" };
    let S2 = { courses_title: "S2", courses_avg: 80, courses_dept: "aanb" };
    let S3 = { courses_title: "S3", courses_avg: 80, courses_dept: "bbbb" };
    let S4 = { courses_title: "S4", courses_avg: 70, courses_dept: "bbcc" };
    let mockSections = [S1, S2, S3, S4];

    it("Accept: Sort One Child Default (Ascending)", function () {
        let query = {   WHERE: {    GT: { courses_avg: 98.7 } },
                        OPTIONS: {  COLUMNS: [ "courses_dept", "courses_avg" ],
                                    ORDER: "courses_avg" } };
        let expected = [S4, S2, S3, S1];
        assert.equal(runQuery.doOrder(mockSections, query), expected);
    });

    it("Accept: Sort Two Children Ascending", function () {
        let query = {   WHERE: {    GT: { courses_avg: 98.7 } },
                        OPTIONS: {  COLUMNS:    [ "courses_dept", "courses_avg" ],
                                    ORDER:      {   dir: "UP",
                                                    keys: ["courses_avg"] } } };
        let expected = [S4, S2, S3, S1];
        assert.equal(runQuery.doOrder(mockSections, query), expected);
    });
    it("Accept: Sort Two Children Descending", function () {
        let query = {   WHERE: {    GT: { courses_avg: 98.7 } },
            OPTIONS: {  COLUMNS:    [ "courses_dept", "courses_avg" ],
                        ORDER:      {   dir: "DOWN",
                                        keys: ["courses_avg"] } } };
        let expected = [S1, S2, S3, S4];
        assert.equal(runQuery.doOrder(mockSections, query), expected);
    });
    it("Accept: Sort Two Children Two Keys Ascending", function () {
        let query = {   WHERE: {    GT: { courses_avg: 98.7 } },
            OPTIONS: {  COLUMNS:    [ "courses_dept", "courses_avg" ],
                ORDER:      {   dir: "UP",
                    keys: ["courses_dept", "courses_avg"] } } };
        let expected = [S2, S1, S3, S4];
        assert.equal(runQuery.doOrder(mockSections, query), expected);
    });


});
