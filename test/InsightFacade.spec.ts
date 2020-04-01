import {assert, expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

// describe("InsightFacade Add/Remove Dataset", function () {
//     // Reference any datasets you've added to test/data here and they will
//     // automatically be loaded in the 'before' hook.
//     const datasetsToLoad: { [id: string]: string } = {
//         courses: "./test/data/courses.zip",
//         empty: "./test/data/empty.zip",
//         onecourseemptyjson: "./test/data/onecourseemptyjson.zip",
//         onecoursenosections: "./test/data/onecoursenosections.zip",
//         duplicatecourse: "./test/data/duplicatecourse.zip",
//         nocoursesfolder: "./test/data/nocoursesfolder.zip",
//         onevalidfileothersnot: "./test/data/onevalidfileothersnot.zip",
//         valid1course: "./test/data/valid1course.zip",
//         AAN: "./test/data/AAN.zip",
//         notazip: "./test/data/notazip.txt",
//         rooms: "./test/data/rooms.zip",
//         roomsnotnamedrooms: "./test/data/roomsnotnamedrooms.zip"
//     };
//     let datasets: { [id: string]: string } = {};
//     let insightFacade: InsightFacade;
//     const cacheDir = __dirname + "/../data";
//
//     before(function () {
//         // This section runs once and loads all datasets specified in the datasetsToLoad object
//         // into the datasets object
//         Log.test(`Before all`);
//         for (const id of Object.keys(datasetsToLoad)) {
//             datasets[id] = fs
//                 .readFileSync(datasetsToLoad[id])
//                 .toString("base64");
//         }
//         insightFacade = new InsightFacade();
//     });
//
//     beforeEach(function () {
//         // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
//         // This runs before each test, which should make each test independent from the previous one
//         Log.test(`BeforeTest: ${this.currentTest.title}`);
//         try {
//             fs.removeSync(cacheDir);
//             fs.mkdirSync(cacheDir);
//             insightFacade = new InsightFacade();
//             fs.unlinkSync("data/datasets.txt");
//         } catch (err) {
//             // Log.error(err);
//         }
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
//     it("Should add a valid rooms dataset", function () {
//         const id: string = "rooms";
//         const expected: string[] = [id];
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
//             .then((result: string[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected, "Should not have rejected");
//             });
//     });
//
//     it("Should add a valid rooms dataset not named rooms", function () {
//         const id: string = "roomsnotnamedrooms";
//         const expected: string[] = [id, "rooms"];
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
//             .then(() => {
//                 return insightFacade.addDataset("rooms", datasets["rooms"], InsightDatasetKind.Rooms);
//             })
//             .then((result: string[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected, "Should not have rejected");
//             });
//     });
//
//     // This is a unit test. You should create more like this!
//     it("Should fail to add a valid dataset in an invalid file (not a zip, txt file)", function () {
//         const id: string = "notazip";
//         const expected: string[] = [id];
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail(result, expected, "Should not have resolved");
//             })
//             .catch((err: any) => {
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("Should add a valid dataset with 1 course", function () {
//         const id: string = "AAN";
//         const expected: string[] = [id];
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected, "Should not have rejected");
//             });
//     });
//
//     it("Should add a valid dataset, duplicate courses", function () {
//         const id: string = "duplicatecourse";
//         const expected: string[] = [id];
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected, "Should not have rejected");
//             });
//     });
//
//     it("Should add a valid dataset but skip over invalid files", function () {
//         const id: string = "onevalidfileothersnot";
//         const expected: string[] = [id];
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected, "Should not have rejected");
//             });
//     });
//
//     it("should fail to add invalid dataset: id contains underscore", function () {
//         const id: string = "invalid_";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, id contains underscore");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains underscore"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: id is null", function () {
//         const id: string = null;
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, id is null");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains underscore"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: contains no valid sections", function () {
//         const id: string = "onecourseemptyjson";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, no valid sections");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("invalid dataset: course has no sections"));
//                 assert.instanceOf(err, InsightError);
//
//             });
//     });
//
//     it("should fail to add invalid dataset: course has no sections", function () {
//         const id: string = "onecoursenosections";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, id contains underscore");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("invalid dataset: contains no valid sections"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: id contains only whitespace", function () {
//         const id: string = " ";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, id contains only whitespace (space)");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains only whitespace characters"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: id contains only whitespace (tab)", function () {
//         const id: string = "    ";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, id contains only whitespace");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains only whitespace characters"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("Should fail to add invalid dataset: id already exists", function () {
//         const id: string = "courses";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//             })
//             .then((result: string[]) => {
//                 expect.fail("should not have accepted, same id added twice");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("dataset invalid: dataset with same id already added"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: empty zip file", function () {
//         const id: string = "empty";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should not have accepted, id is empty");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("invalid dataset: contains no valid sections"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: no courses folder", function () {
//         const id: string = "nocoursesfolder";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should not have accepted, no courses folder");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("zip file invalid: no courses folder in root"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//
//     it("Should remove an existing dataset", function () {
//         const id: string = "AAN";
//         const expected: string = id;
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 return insightFacade.removeDataset(id);
//             })
//             .then((result: string) => {
//                 assert.equal(result, "AAN");
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected, `should not have rejected: ${err}`);
//             });
//     });
//
//     it("should fail to remove a non-existent dataset", () => {
//         const id: string = "AAN";
//         return insightFacade
//             .removeDataset(id)
//             .then((result: string) => {
//                 expect.fail("should not have fulfilled, tried to remove non-existent dataset");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new NotFoundError("tried to remove nonexistent dataset"));
//                 assert.instanceOf(err, NotFoundError);
//             });
//     });
//
//     it("should fail to remove invalid dataset: id contains underscore", function () {
//         const id: string = "invalid_";
//         return insightFacade
//             .removeDataset(id)
//             .then((result: string) => {
//                 expect.fail("should have rejected, id contains underscore");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains underscore"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to remove invalid dataset: id contains only whitespace (single space)", function () {
//         const id: string = " ";
//         return insightFacade
//             .removeDataset(id)
//             .then((result: string) => {
//                 expect.fail("should have rejected, id contains only whitespace");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains only whitespace"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to remove invalid dataset: id contains only whitespace (tab)", function () {
//         const id: string = "    ";
//         return insightFacade
//             .removeDataset(id)
//             .then((result: string) => {
//                 expect.fail("should have rejected, id contains only whitespace");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains only whitespace"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//
//     it("should display no datasets", () => {
//         const expected: InsightDataset[] = [];
//         return insightFacade
//             .listDatasets()
//             .then((result: InsightDataset[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail("should not have failed with " + err);
//             });
//     });
//
//     it("should display one dataset: courses", () => {
//         const id: string = "courses";
//         const ids1: InsightDataset = {
//             id: "courses",
//             kind: InsightDatasetKind.Courses,
//             numRows: 64612,
//         };
//         const expected: InsightDataset[] = [ids1];
//         return insightFacade
//             .addDataset("courses", datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 return insightFacade.listDatasets();
//             })
//             .then((result: InsightDataset[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail("should not have failed: " + err);
//             });
//     });
//
//     // it("should fail to perform query on nonexistent dataset", () => {
//     //     const id: string = "dne";
//     //     return insightFacade
//     //         .performQuery(TestUtil.readTestQueries()[0])
//     //         .then((result: any[]) => {
//     //             expect.fail("no dataset to perform query on, should have failed");
//     //         })
//     //         .catch((err: any) => {
//     //             // assert.equal(err, new InsightError("no dataset to perform query on"));
//     //             assert.instanceOf(err, InsightError);
//     //         });
//     // });
//
//     it("should display 2 datasets: AAN and valid1course", () => {
//         const id1: string = "AAN";
//         const id2: string = "valid1course";
//         const ids1: InsightDataset = {
//             id: "AAN",
//             kind: InsightDatasetKind.Courses,
//             numRows: 2,
//         };
//         const ids2: InsightDataset = {
//             id: "valid1course",
//             kind: InsightDatasetKind.Courses,
//             numRows: 18
//         };
//         const expected: InsightDataset[] = [ids1, ids2];
//         return insightFacade
//             .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
//             })
//             .then((result: string[]) => {
//                 return insightFacade.listDatasets();
//             })
//             .then((result: InsightDataset[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail("should not have failed: " + err);
//             });
//     });

//     it("Should add a valid rooms dataset", function () {
//         const id: string = "rooms";
//         const expected: string[] = [id];
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
//             .then((result: string[]) => {
//                //
//             })
//             .catch((err: any) => {
//                 //
//             });
//     });
//
//     // This is a unit test. You should create more like this!
//     it("Should fail to add a valid dataset in an invalid file (not a zip, txt file)", function () {
//         const id: string = "notazip";
//         const expected: string[] = [id];
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail(result, expected, "Should not have resolved");
//             })
//             .catch((err: any) => {
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("Should add a valid dataset with 1 course", function () {
//         const id: string = "AAN";
//         const expected: string[] = [id];
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected, "Should not have rejected");
//             });
//     });
//
//     it("Should add a valid dataset, duplicate courses", function () {
//         const id: string = "duplicatecourse";
//         const expected: string[] = [id];
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected, "Should not have rejected");
//             });
//     });
//
//     it("Should add a valid dataset but skip over invalid files", function () {
//         const id: string = "onevalidfileothersnot";
//         const expected: string[] = [id];
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected, "Should not have rejected");
//             });
//     });
//
//     it("should fail to add invalid dataset: id contains underscore", function () {
//         const id: string = "invalid_";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, id contains underscore");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains underscore"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: id is null", function () {
//         const id: string = null;
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, id is null");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains underscore"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: contains no valid sections", function () {
//         const id: string = "onecourseemptyjson";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, no valid sections");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("invalid dataset: course has no sections"));
//                 assert.instanceOf(err, InsightError);
//
//             });
//     });
//
//     it("should fail to add invalid dataset: course has no sections", function () {
//         const id: string = "onecoursenosections";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, id contains underscore");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("invalid dataset: contains no valid sections"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: id contains only whitespace", function () {
//         const id: string = " ";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, id contains only whitespace (space)");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains only whitespace characters"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: id contains only whitespace (tab)", function () {
//         const id: string = "    ";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should have rejected, id contains only whitespace");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains only whitespace characters"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("Should fail to add invalid dataset: id already exists", function () {
//         const id: string = "courses";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//             })
//             .then((result: string[]) => {
//                 expect.fail("should not have accepted, same id added twice");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("dataset invalid: dataset with same id already added"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: empty zip file", function () {
//         const id: string = "empty";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should not have accepted, id is empty");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("invalid dataset: contains no valid sections"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to add invalid dataset: no courses folder", function () {
//         const id: string = "nocoursesfolder";
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect.fail("should not have accepted, no courses folder");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("zip file invalid: no courses folder in root"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//
//     it("Should remove an existing dataset", function () {
//         const id: string = "AAN";
//         const expected: string = id;
//         return insightFacade
//             .addDataset(id, datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 return insightFacade.removeDataset(id);
//             })
//             .then((result: string) => {
//                 assert.equal(result, "AAN");
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected, `should not have rejected: ${err}`);
//             });
//     });
//
//     it("should fail to remove a non-existent dataset", () => {
//         const id: string = "AAN";
//         return insightFacade
//             .removeDataset(id)
//             .then((result: string) => {
//                 expect.fail("should not have fulfilled, tried to remove non-existent dataset");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new NotFoundError("tried to remove nonexistent dataset"));
//                 assert.instanceOf(err, NotFoundError);
//             });
//     });
//
//     it("should fail to remove invalid dataset: id contains underscore", function () {
//         const id: string = "invalid_";
//         return insightFacade
//             .removeDataset(id)
//             .then((result: string) => {
//                 expect.fail("should have rejected, id contains underscore");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains underscore"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to remove invalid dataset: id contains only whitespace (single space)", function () {
//         const id: string = " ";
//         return insightFacade
//             .removeDataset(id)
//             .then((result: string) => {
//                 expect.fail("should have rejected, id contains only whitespace");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains only whitespace"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//     it("should fail to remove invalid dataset: id contains only whitespace (tab)", function () {
//         const id: string = "    ";
//         return insightFacade
//             .removeDataset(id)
//             .then((result: string) => {
//                 expect.fail("should have rejected, id contains only whitespace");
//             })
//             .catch((err: any) => {
//                 // assert.equal(err, new InsightError("id invalid: contains only whitespace"));
//                 assert.instanceOf(err, InsightError);
//             });
//     });
//
//
//     it("should display no datasets", () => {
//         const expected: InsightDataset[] = [];
//         return insightFacade
//             .listDatasets()
//             .then((result: InsightDataset[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail("should not have failed with " + err);
//             });
//     });
//
//     it("should display one dataset: courses", () => {
//         const id: string = "courses";
//         const ids1: InsightDataset = {
//             id: "courses",
//             kind: InsightDatasetKind.Courses,
//             numRows: 64612,
//         };
//         const expected: InsightDataset[] = [ids1];
//         return insightFacade
//             .addDataset("courses", datasets[id], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 return insightFacade.listDatasets();
//             })
//             .then((result: InsightDataset[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail("should not have failed: " + err);
//             });
//     });
//
//     // it("should fail to perform query on nonexistent dataset", () => {
//     //     const id: string = "dne";
//     //     return insightFacade
//     //         .performQuery(TestUtil.readTestQueries()[0])
//     //         .then((result: any[]) => {
//     //             expect.fail("no dataset to perform query on, should have failed");
//     //         })
//     //         .catch((err: any) => {
//     //             // assert.equal(err, new InsightError("no dataset to perform query on"));
//     //             assert.instanceOf(err, InsightError);
//     //         });
//     // });
//
//     it("should display 2 datasets: AAN and valid1course", () => {
//         const id1: string = "AAN";
//         const id2: string = "valid1course";
//         const ids1: InsightDataset = {
//             id: "AAN",
//             kind: InsightDatasetKind.Courses,
//             numRows: 2,
//         };
//         const ids2: InsightDataset = {
//             id: "valid1course",
//             kind: InsightDatasetKind.Courses,
//             numRows: 18
//         };
//         const expected: InsightDataset[] = [ids1, ids2];
//         return insightFacade
//             .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
//             })
//             .then((result: string[]) => {
//                 return insightFacade.listDatasets();
//             })
//             .then((result: InsightDataset[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail("should not have failed: " + err);
//             });
//     });
//
//     it("branch coverage test: addDataset, removeDataset, listDatasets", () => {
//         const id1: string = "AAN";
//         const id2: string = "valid1course";
//         const expected1: string[] = [id1];
//         const expected2: string[] = [id1, id2];
//         const ids1: InsightDataset = {
//             id: "AAN",
//             kind: InsightDatasetKind.Courses,
//             numRows: 2,
//         };
//         const ids2: InsightDataset = {
//             id: "valid1course",
//             kind: InsightDatasetKind.Courses,
//             numRows: 18
//         };
//         const expected3: InsightDataset[] = [ids1, ids2];
//         const expected4: InsightDataset[] = [ids2];
//         return insightFacade
//             .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
//             .then((result: string[]) => {
//                 expect(result).to.deep.equal(expected1);
//                 return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected1, "should not have failed, err: " + err);
//             })
//             .then((result: string[]) => {
//                 expect(result).to.deep.equal(expected2);
//                 return insightFacade.listDatasets();
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected2, "should not have failed, err: " + err);
//             })
//             .then((result: InsightDataset[]) => {
//                 expect(result).to.deep.equal(expected3);
//                 return insightFacade.removeDataset(id1);
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected3, "should not have failed, err: " + err);
//             })
//             .then((result: string) => {
//                 assert.equal(id1, result);
//                 return insightFacade.listDatasets();
//             })
//             .catch((err: any) => {
//                 expect.fail(err, expected4, "should not have failed, err: " + err);
//             });
//     });
// });

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = {
        AAN: {
            path: "./test/data/AAN.zip",
            kind: InsightDatasetKind.Courses,
        },
        rooms: {
            path: "./test/data/rooms.zip",
            kind: InsightDatasetKind.Rooms,
        },
        courses: {
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
        roomsnotnamedrooms: {
            path: "./test/data/roomsnotnamedrooms.zip",
            kind: InsightDatasetKind.Rooms,
        }
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];
    const cacheDir = __dirname + "/../data";


    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            fs.unlinkSync("data/datasets.txt");
        } catch (err) {
            // Log.error(err);
        }
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            // const cacheDir: string = __dirname + "/" + "../data";
            // // Log.trace(cacheDir);
            // // fs.removeSync(cacheDir);
            // // fs.mkdirSync(cacheDir);
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises);
    });

    beforeEach(function () {
        try {
            fs.unlinkSync("data/datasets.txt");
        } catch (err) {
            //
        }
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // it("roomtest w courses in group", function () {
    //     let query =  {
    //         WHERE: {
    //             OR: [
    //                 {
    //                     IS: {
    //                         rooms_furniture: "*Tables*"
    //                     }
    //                 },
    //                 {
    //                     GT: {
    //                         rooms_seats: 300
    //                     }
    //                 }
    //             ]
    //         },
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "rooms_lat",
    //                 "rooms_lon",
    //                 "rooms_shortname"
    //             ],
    //             ORDER: {
    //                 dir: "DOWN",
    //                 keys: [
    //                     "rooms_lat"
    //                 ]
    //             }
    //         },
    //         TRANSFORMATIONS: {
    //             GROUP: [
    //                 "rooms_shortname",
    //                 "rooms_lat",
    //                 "rooms_lon"
    //             ],
    //             APPLY: [
    //                 {
    //                     maxSeats: {
    //                         MAX: "rooms_seats"
    //                     }
    //                 },
    //                 {
    //                     maxSeats: {
    //                         MAX: 1
    //                     }
    //                 }
    //             ]
    //         }
    //     };
    //     let result = insightFacade.performQuery(query);
    //     Log.trace(result);
    // });

    /** This is a flexible test where we replace queries */
    it("bobloblaw", function () {
        let query = {
            WHERE: {
                GT: {
                    courses_avg: 97
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_pass",
                    "overallAvg"
                ]
            },
            TRANSFORMATIONS: {
                GROUP: [
                    "courses_pass",
                    "courses_id"
                ],
                APPLY: [
                    {
                        overallAvg: {
                            MIN: "courses_avg"
                        }
                    }
                ]
            }
        };
        let result = insightFacade.performQuery(query);
        Log.trace(result);
    });

    it("Should reject, query is just {} ", function () {
        let query =  {};
        // let result = insightFacade.performQuery(query);
        return insightFacade.performQuery(query)
            .then((result: any) => {
                expect.fail("Should not have passed");
            })
            .catch((err: any) => {
                expect(err).instanceOf(InsightError);
            });
        // Log.trace(result);
    });


    //         const expected: InsightDataset[] = [];
//         return insightFacade
//             .listDatasets()
//             .then((result: InsightDataset[]) => {
//                 expect(result).to.deep.equal(expected);
//             })
//             .catch((err: any) => {
//                 expect.fail("should not have failed with " + err);
//             });
//     /** This test should use cpsc.zip. WHERE: {} with ORDER should return the whole list with ORDER, not reject */
//     it("{} WHERE should return ordered list}", function () {
//         let query =  { WHERE: {}, OPTIONS: {
//                 COLUMNS: [ "courses_dept", "courses_avg" ],
//                 ORDER: "courses_avg" } };
//         let result = insightFacade.performQuery(query);
//         Log.trace(result);
//     });

    // Dynamically create and run a test for each query in testQueries.
    // Creates an extra "test" called "Should run test queries" as a byproduct.
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    const resultChecker = TestUtil.getQueryChecker(test, done);
                    insightFacade.performQuery(test.query)
                        .then(resultChecker)
                        .catch(resultChecker);
                });
            }
        });
    });

    /** General test for queries */
    // /** This test should use AAN.zip. WHERE: {} with ORDER should return the whole list with ORDER, not reject */
    // it("{} WHERE should return ordered list}", function () {
    //     let query =  { WHERE: {}, OPTIONS: {
    //             COLUMNS: [ "AAN_dept", "AAN_avg" ],
    //             ORDER: "AAN_avg" } };
    //     let result = insightFacade.performQuery(query);
    //     Log.trace(result);
    // });
    // it("test performQuery using a dataset not named rooms", function () {
    //     let query =  { WHERE: {}, OPTIONS: {
    //             COLUMNS: [ "roomsnotnamedrooms_name", "roomsnotnamedrooms_lat" ],
    //             ORDER: "roomsnotnamedrooms_name" } };
    //     let result = insightFacade.performQuery(query);
    //     Log.trace(result);
    // });
});
