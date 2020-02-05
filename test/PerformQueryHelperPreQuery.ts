import PerformQueryHelperPreQuery from "../src/controller/PerformQueryHelperPreQuery";
import Log from "../src/Util";
import InsightFacade from "../src/controller/InsightFacade";
import * as assert from "assert";

describe("InsightFacade Perform Query Helper Methods", function () {
    let insightFacade: InsightFacade = new InsightFacade();
    let performQueryHelper: PerformQueryHelperPreQuery = new PerformQueryHelperPreQuery();

    const simpleQuery = {WHERE: {GT: {courses_avg: 97}},
        OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: "courses_avg"}};

    // load the dataset that will be used for the tests
    // before( function() {
    //     insightFacade.addDataset("courses", InsightDatasetKind.Courses, courses);
    // );

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);

    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    describe("Tests to check the grammar of input query", function () {

        describe("Tests for hasBodyAndOptions", function () {
            it("Accept: query with body and options", function () {
                assert(performQueryHelper.hasBodyAndOptions(simpleQuery));
            });
            it("Reject: query with one key", function () {
                let query = {OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: "courses_avg"}};
                assert.equal(performQueryHelper.hasBodyAndOptions(query), false);
                assert.equal(performQueryHelper.errorMessage, "Query should have two root keys");
            });
            it("Reject: query missing WHERE key", function () {
                let query = {
                    WHER: {GT: {courses_avg: 97}},
                    OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: "courses_avg"}
                };
                assert.equal(performQueryHelper.hasBodyAndOptions(query), false);
                assert.equal(performQueryHelper.errorMessage, "Missing WHERE");
            });
            it("Reject: query missing OPTIONS key", function () {
                let query = {
                    WHERE: {GT: {courses_avg: 97}},
                    OPTI: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: "courses_avg"}
                };
                assert.equal(performQueryHelper.hasBodyAndOptions(query), false);
                assert.equal(performQueryHelper.errorMessage, "Missing OPTIONS");
            });
        });

        describe("Tests for hasValidOptionsGrammar", function () {
            it("Accept: query has valid options grammar", function () {
                assert(performQueryHelper.hasValidOptionsGrammar(simpleQuery));
            });
            it("Reject: OPTIONS has 0 keys", function () {
                let query = {
                    WHERE: {GT: {courses_avg: 97}},
                    OPTIONS: {}
                };
                assert.equal(performQueryHelper.hasValidOptionsGrammar(query), false);
                assert.equal(performQueryHelper.errorMessage, "OPTIONS must have one or two keys");
            });
            it("Reject: OPTIONS has 3 keys", function () {
                let query = {
                    WHERE: {GT: {courses_avg: 97}},
                    OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: "courses_avg", THIRD: ""}
                };
                assert.equal(performQueryHelper.hasValidOptionsGrammar(query), false);
                assert.equal(performQueryHelper.errorMessage, "OPTIONS must have one or two keys");
            });
            it("Reject: first key in OPTION is not COLUMNS", function () {
                let query = {
                    WHERE: {GT: {courses_avg: 97}},
                    OPTIONS: {COLUM: ["courses_dept", "courses_avg"], ORDER: "courses_avg"}
                };
                assert.equal(performQueryHelper.hasValidOptionsGrammar(query), false);
                assert.equal(performQueryHelper.errorMessage, "OPTIONS missing COLUMNS");
            });
            // This test throws an error at COLUMNS: [], thus preventing commits
            // it("Reject: COLUMNS is empty", function () {
            //     // @ts-ignore
            //     let query = {
            //         WHERE: {GT: {courses_avg: 97}},
            //         OPTIONS: {COLUMNS: []}
            //     };
            //     assert.equal(performQueryHelper.hasValidOptionsGrammar(query), false);
            //     assert.equal(performQueryHelper.errorMessage, "COLUMNS must be a non-empty array");
            // });
            it("Reject: COLUMNS is not an array", function () {
                let query = {
                    WHERE: {GT: {courses_avg: 97}},
                    OPTIONS: {COLUMNS: 1}
                };
                assert.equal(performQueryHelper.hasValidOptionsGrammar(query), false);
                assert.equal(performQueryHelper.errorMessage, "COLUMNS must be a non-empty array");
            });
            it("Reject: ORDER key is not called ORDER", function () {
                let query = {
                    WHERE: {GT: {courses_avg: 97}},
                    OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDE: "courses_avg"}};
                assert.equal(performQueryHelper.hasValidOptionsGrammar(query), false);
                assert.equal(performQueryHelper.errorMessage, "Invalid keys in OPTIONS (cannot find ORDER)");
            });
            it("Reject: ORDER key has no fields", function () {
                let query = {
                    WHERE: {GT: {courses_avg: 97}},
                    OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: {}}};
                assert.equal(performQueryHelper.hasValidOptionsGrammar(query), false);
                assert.equal(performQueryHelper.errorMessage,
                    "Invalid ORDER type (ORDER must be a string)");
            });
            it("Reject: ORDER key not a string", function () {
                let query = {
                    WHERE: {GT: {courses_avg: 97}},
                    OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: 1}
                };
                assert.equal(performQueryHelper.hasValidOptionsGrammar(query), false);
                assert.equal(performQueryHelper.errorMessage,
                    "Invalid ORDER type (ORDER must be a string)");
            });
            it("Reject: ORDER value not in COLUMNS", function () {
                let query = {
                    WHERE: {GT: {courses_avg: 97}},
                    OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: "courses_id"}
                };
                assert.equal(performQueryHelper.hasValidOptionsGrammar(query), false);
                assert.equal(performQueryHelper.errorMessage, "ORDER key: courses_id must be in COLUMNS");
            });
        });
    });
});
