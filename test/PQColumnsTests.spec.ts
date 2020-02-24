import InsightFacade from "../src/controller/InsightFacade";
import PQPreQSyntax from "../src/controller/PQPreQSyntax";
import PQRunQuery from "../src/controller/PQRunQuery";
import PQTransformer from "../src/controller/PQTransformer";
import Log from "../src/Util";
import * as assert from "assert";
import PQPreQSemantics from "../src/controller/PQPreQSemantics";

describe("Columns Tests", function () {
    let insightFacade: InsightFacade = new InsightFacade();
    let syntaxChecker: PQPreQSyntax = new PQPreQSyntax();
    let semanticsChecker: PQPreQSemantics = new PQPreQSemantics();
    let runQuery: PQRunQuery = new PQRunQuery();
    let transformer: PQTransformer = new PQTransformer();

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

// CHECK COLUMNS SYNTAX ================================================================

// CHECK COLUMNS SEMANTICS ================================================================
    it("Accept: single valid item", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title" ] } };
        assert.equal(semanticsChecker.checkColumnSemantics(query), true);
    });
    it("Accept: double valid item", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "courses_dept" ] } };
        assert.equal(semanticsChecker.checkColumnSemantics(query), true);
    });
    it("Accept: duplicate valid item", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "courses_title" ] } };
        assert.equal(semanticsChecker.checkColumnSemantics(query), true);
    });
    it("Reject: invalid field", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "courses_bobloblaw" ] } };
        assert.equal(semanticsChecker.checkColumnSemantics(query), false);
    });
    it("Reject: dataset not loaded yet", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "cour_title", "courses_bobloblaw" ] } };
        assert.equal(semanticsChecker.checkColumnSemantics(query), false);
    });
    it("Reject: cannot ref mult dataset", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "cour_dept" ] } };
        assert.equal(semanticsChecker.checkColumnSemantics(query), false);
    });

// CHECK COLUMNS SEMANTICS - GROUP ================================================================
    it("Accept: COLUMN only has 'courses_title', which is in GROUP", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                APPLY: [  { overallAvg: { AVG: "courses_avg" } },
                    { hello: { AVG: "courses_avg" } } ] } };
        assert.equal(semanticsChecker.checkColumnSemantics(query), true);
    });
    it("Reject: COLUMN has a valid item not in APPLY or GROUP", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "courses_dept" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                APPLY: [  { overallAvg: { AVG: "courses_avg" } },
                    { hello: { AVG: "courses_avg" } } ] } };
        assert.equal(semanticsChecker.checkColumnSemantics(query), false);
    });

// CHECK COLUMNS SEMANTICS - APPLY ================================================================
    it("Accept: COLUMN items in APPLY", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "overallAvg" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                                    APPLY: [  { overallAvg: { AVG: "courses_avg" } },
                                                { hello: { AVG: "courses_avg" } } ] } };
        assert.equal(semanticsChecker.checkColumnSemantics(query), true);
    });
    it("Reject: COLUMN item not in APPLY", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "courses_title", "notInApply" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                APPLY: [  { overallAvg: { AVG: "courses_avg" } },
                    { hello: { AVG: "courses_avg" } } ] } };
        assert.equal(semanticsChecker.checkColumnSemantics(query), false);
    });
    it("Accept: COLUMN only has 'hello', which is in APPLY", function () {
        let query = {
            WHERE: {},
            OPTIONS: { COLUMNS: [ "hello" ] },
            TRANSFORMATIONS: {    GROUP: [ "courses_title" ],
                APPLY: [  { overallAvg: { AVG: "courses_avg" } },
                    { hello: { AVG: "courses_avg" } } ] } };
        assert.equal(semanticsChecker.checkColumnSemantics(query), true);
    });

});
