/*
import PerformQueryHelper from "../src/controller/PerformQueryHelper";
import Log from "../src/Util";
import InsightFacade from "../src/controller/InsightFacade";
import {InsightDatasetKind} from "../src/controller/IInsightFacade";

describe("InsightFacade Perform Query Helper Methods", function () {
    let insightFacade: InsightFacade = new InsightFacade();
    let performQueryHelper: PerformQueryHelper = new PerformQueryHelper();

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

        describe("Tests for body and options", function () {

            it("Accept: query with body and options", function () {
                let query = {
                    "WHERE": {
                        "GT": {
                            "courses_avg": 97
                        }
                    },
                    "OPTIONS": {
                        "COLUMNS": [
                            "courses_dept",
                            "courses_avg"
                        ],
                        "ORDER": "courses_avg"
                    }
                };

                performQueryHelper.inputQueryIsValid(query).then

            });
        });
    });
});
*/
