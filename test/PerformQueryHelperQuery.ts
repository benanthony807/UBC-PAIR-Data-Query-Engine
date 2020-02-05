import InsightFacade from "../src/controller/InsightFacade";
import PerformQueryHelperQuery from "../src/controller/PerformQueryHelperQuery";
import Log from "../src/Util";
import * as assert from "assert";
import PerformQueryHelperQueryHelper from "../src/controller/PerformQueryHelperQueryHelper";
import {IInsightFacade, InsightDatasetKind} from "../src/controller/IInsightFacade";
import Dataset from "../src/controller/Dataset";
import PerformQueryHelperPreQuery from "../src/controller/PerformQueryHelperPreQuery";

describe("InsightFacade Perform Query Helper Methods", function () {
    let insightFacade: InsightFacade = new InsightFacade();
    let performQueryHelper: PerformQueryHelperQuery = new PerformQueryHelperQuery();
    let performQueryHelperQH: PerformQueryHelperQueryHelper = new PerformQueryHelperQueryHelper();
    let performQueryHelperPreQuery: PerformQueryHelperPreQuery = new PerformQueryHelperPreQuery();

    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
    };
    let datasets: { [id: string]: string } = {};
    const cacheDir = __dirname + "/../data";

    before(function () {
        const id: string = "courses";
        insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);

    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    describe("Tests to check NOT function", function () {
        it("Reject: NOT has no key", function () {
            let query = {WHERE: {NOT: {}}};
            assert.equal(performQueryHelper.doFilter(query["WHERE"]), "NOT should only have 1 key, has 0");
        });
    });

    describe("Tests to check AND function", function () {
        it("Reject: AND is empty", function () {
            let query = {WHERE: {AND: {}}};
            assert.equal(performQueryHelper.doFilter(query["WHERE"]), "AND must be a non-empty array");
        });
    });

    describe("Tests for Helper Functions", function () {
        it("Accept: Able to isolate current key and compare to dataset key", function () {
            let query = {GT: {courses_avg: 90}};
            let currKeyVal = Object.keys(query["GT"])[0]; // ex. courses_avg
            assert.equal(currKeyVal, "courses_avg");
            let currKey = currKeyVal.substring(0, currKeyVal.indexOf("_")); // isolates the id, ex. "courses"
            assert.equal(currKey, "courses");
            if (currKey !== "courses") { // okay to assume this dataSetId is one of the loaded courses in datset
                return "Cannot query more than one dataset";
            }
        });
        it("Reject: Different keys", function () {
            let query = {GT: {courses_avg: 90}};
            let currKeyVal = Object.keys(query["GT"])[0]; // ex. courses_avg
            assert.equal(currKeyVal, "courses_avg");
            let currKey = currKeyVal.substring(0, currKeyVal.indexOf("_")); // isolates the id, ex. "courses"
            assert.equal(currKey, "courses");
            let answer = "";
            if (currKey !== "notCourses") { // okay to assume this dataSetId is one of the loaded courses in datset
                 answer = "Cannot query more than one dataset";
            }
            assert.equal(answer, "Cannot query more than one dataset");
        });
    });

    // Putting this here to utilize the fact that dataset is already loaded
    describe("My Tests for doFilter", function () {
        it("Accept: Simple query", function () {
            let query = {GT: {courses_avg: 99.7}};


        });
    });

});
