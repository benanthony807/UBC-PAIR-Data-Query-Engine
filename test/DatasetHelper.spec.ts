import * as fs from "fs-extra";
import {InsightDatasetKind} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import Dataset from "../src/controller/Dataset";
import DatasetHelper from "../src/controller/DatasetHelper";
import Course from "../src/controller/Course";
let assert = require("chai").assert;

describe("InsightFacade Dataset Helper Methods", function () {

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    describe("idValid tests", function () {
        it("should accept a valid id", function () {
            const id: string = "validid";
            const ds: Dataset[] = [];
            const datasetHelper: DatasetHelper = new DatasetHelper();
            return assert.isTrue(datasetHelper.idValid(id, ds));
        });

        it("should reject invalid id: contains underscore", function () {
            const id: string = "_invalid";
            const ds: Dataset[] = [];
            const datasetHelper: DatasetHelper = new DatasetHelper();
            return assert.isFalse(datasetHelper.idValid(id, ds));
        });

        it("should reject invalid id: contains only whitespace: space", function () {
            const id: string = " ";
            const ds: Dataset[] = [];
            const datasetHelper: DatasetHelper = new DatasetHelper();
            return assert.isFalse(datasetHelper.idValid(id, ds));
        });

        it("should reject invalid id: contains only whitespace: tab", function () {
            const id: string = "    ";
            const ds: Dataset[] = [];
            const datasetHelper: DatasetHelper = new DatasetHelper();
            return assert.isFalse(datasetHelper.idValid(id, ds));
        });

        it("should reject invalid id: id already exists in ds", function () {
            const id: string = "valid";
            const courses: Course[] = [];
            const dataset: Dataset = new Dataset("valid", InsightDatasetKind.Courses, courses);
            const ds: Dataset[] = [dataset];
            const datasetHelper: DatasetHelper = new DatasetHelper();
            return assert.isFalse(datasetHelper.idValid(id, ds));
        });

        it("should reject invalid id: id already exists in ds, second item in array", function () {
            const id: string = "valid2";
            const courses: Course[] = [];
            const dataset1: Dataset = new Dataset("valid1", InsightDatasetKind.Courses, courses);
            const dataset2: Dataset = new Dataset("valid2", InsightDatasetKind.Courses, courses);
            const ds: Dataset[] = [dataset1, dataset2];
            const datasetHelper: DatasetHelper = new DatasetHelper();
            return assert.isFalse(datasetHelper.idValid(id, ds));
        });
    });

    describe("diagnoseIssue tests", function () {
        it("should return string: \"id invalid: contains underscore\"", function () {
            const id: string = "invalid_";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const ds: Dataset[] = [];
            const datasetHelper: DatasetHelper = new DatasetHelper();
            const result: string = "id invalid: contains underscore";

            return assert.deepEqual(result, datasetHelper.diagnoseIssue(id, kind, ds));
        });

        it("should return string: \"id invalid: contains only whitespace characters\"", function () {
            const id: string = " ";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const ds: Dataset[] = [];
            const datasetHelper: DatasetHelper = new DatasetHelper();
            const result: string = "id invalid: contains only whitespace characters";

            return assert.deepEqual(result, datasetHelper.diagnoseIssue(id, kind, ds));
        });

        it("should return string: \"id invalid: contains only whitespace characters\"", function () {
            const id: string = "    ";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const ds: Dataset[] = [];
            const datasetHelper: DatasetHelper = new DatasetHelper();
            const result: string = "id invalid: contains only whitespace characters";

            return assert.deepEqual(result, datasetHelper.diagnoseIssue(id, kind, ds));
        });

        it("should return string: \"kind invalid: rooms is not allowed\"", function () {
            const id: string = "valid";
            const kind: InsightDatasetKind = InsightDatasetKind.Rooms;
            const ds: Dataset[] = [];
            const datasetHelper: DatasetHelper = new DatasetHelper();
            const result: string = "kind invalid: rooms is not allowed";

            return assert.deepEqual(result, datasetHelper.diagnoseIssue(id, kind, ds));
        });

        it("should return string: \"dataset invalid: dataset with same id already added\"", function () {
            const id: string = "valid";
            const kind: InsightDatasetKind = InsightDatasetKind.Courses;
            const courses: Course[] = [];
            const dataset: Dataset = new Dataset("valid", InsightDatasetKind.Courses, courses);
            const ds: Dataset[] = [dataset];
            const datasetHelper: DatasetHelper = new DatasetHelper();
            const result: string = "dataset invalid: dataset with same id already added";

            return assert.deepEqual(result, datasetHelper.diagnoseIssue(id, kind, ds));
        });
    });

    describe("getIds tests", function () {
        it("should return empty array", function () {
            const ds: Dataset[] = [];
            const result: string[] = [];
            const datasetHelper: DatasetHelper = new DatasetHelper();

            return assert.deepEqual(result, datasetHelper.getIds(ds));
        });

        it("should return array with 2 ids", function () {
            const courses: Course[] = [];
            const dataset1: Dataset = new Dataset("valid1", InsightDatasetKind.Courses, courses);
            const dataset2: Dataset = new Dataset("valid2", InsightDatasetKind.Courses, courses);
            const ds: Dataset[] = [dataset1, dataset2];
            const result: string[] = ["valid1", "valid2"];
            const datasetHelper: DatasetHelper = new DatasetHelper();

            return assert.deepEqual(result, datasetHelper.getIds(ds));
        });
    });
});
