import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError,
} from "./IInsightFacade";

import Dataset from "./dataset/Dataset";
import CoursesDatasetHelper from "./dataset/CoursesDatasetHelper";
import Course from "./dataset/Course";
import RoomsDatasetHelper from "./dataset/RoomsDatasetHelper";
import PQRunQuery from "./PQRunQuery";
import PQPreQSyntax from "./PQPreQSyntax";
import PQPreQSemantics from "./PQPreQSemantics";


/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private datasets: Dataset[];
    private coursesDatasetHelper: CoursesDatasetHelper;
    private roomsDatasetHelper: RoomsDatasetHelper;
    private runQuery: PQRunQuery;
    private syntaxChecker: PQPreQSyntax;
    private semanticsChecker: PQPreQSemantics;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.coursesDatasetHelper = new CoursesDatasetHelper();
        this.roomsDatasetHelper = new RoomsDatasetHelper();
        this.runQuery = new PQRunQuery();
        this.datasets = this.coursesDatasetHelper.readDatasets();
        this.syntaxChecker = new PQPreQSyntax();
        this.semanticsChecker = new PQPreQSemantics();
    }


    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (this.coursesDatasetHelper.isAddableDataset(id, kind, this.datasets)) {
            Log.trace("dataset has valid id, kind, and is not already added");
            if (kind === InsightDatasetKind.Courses) {
            return this.addCoursesDataset(content, id, kind);
            } else {
                return this.addRoomsDataset(content, id, kind);
            }
        } else {
            Log.trace("dataset is invalid, either has invalid id, kind, or has already been added");
            return Promise.reject(new InsightError(this.coursesDatasetHelper.diagnoseIssue(id, kind, this.datasets)));
        }
    }

    private addCoursesDataset(content: string, id: string, kind: InsightDatasetKind.Courses) {
        return this.coursesDatasetHelper
            .parseCoursesZip(content)
            .then((courses: Course[]) => {
                let dataset: Dataset = new Dataset(id, kind, courses);
                dataset.filterInvalidSections();
                Log.trace("filtered invalid sections from dataset");
                return dataset.checkCoursesNotEmpty();
            })
            .then((dataset: Dataset) => {
                this.saveDatasetToMemory(dataset);
                return this.coursesDatasetHelper.getIds(this.datasets);
            })
            .catch((err: any) => {
                Log.trace("something went wrong, got to addDataset catch block");
                return Promise.reject(err);
            });
    }

    private addRoomsDataset(content: string, id: string, kind: InsightDatasetKind.Rooms) {
        this.roomsDatasetHelper = new RoomsDatasetHelper();
        return this.roomsDatasetHelper.getAllRoomsMasterMethod(content)
            .then((rooms: any[]) => {
                if (rooms.length > 0) {
                let dataset: Dataset = new Dataset(id, kind, rooms);
                this.saveDatasetToMemory(dataset);
                return this.coursesDatasetHelper.getIds(this.datasets);
                } else {
                    return Promise.reject(new InsightError("invalid dataset: contains no valid rooms"));
                }
            })
            .catch((err: any) => {
                Log.trace("something went wrong in addRoomsDataset");
                return Promise.reject(err);
            });
    }

    private saveDatasetToMemory(dataset: Dataset) {
        Log.trace("dataset has at least one valid section");
        this.datasets.push(dataset);
        this.coursesDatasetHelper.writeToDisk(this.datasets);
        Log.trace("dataset pushed to cache and written to disk");
    }

    public removeDataset(id: string): Promise<string> {
        if (this.coursesDatasetHelper.idValid(id)) {
            Log.trace("dataset has valid id");
            if (this.coursesDatasetHelper.idInDatasets(id, this.datasets)) {
                Log.trace("dataset is in datasets and not already removed");
                this.removeFromCache(id);
                Log.trace("dataset removed from cache");
                this.coursesDatasetHelper.writeToDisk(this.datasets);
                // this.coursesDatasetHelper.removeFromDisk(id);
                Log.trace("dataset removed from disk");
                return Promise.resolve(id);
            }
            Log.trace("dataset wasn't found in array of previously added datasets");
            return Promise.reject(
                new NotFoundError("tried to remove nonexistent dataset"));
        }
        Log.trace("dataset has an invalid id");
        return Promise.reject(
            new InsightError(this.coursesDatasetHelper.diagnoseIssue(id, InsightDatasetKind.Courses, this.datasets)));
    }

    private removeFromCache(id: string) {
        for (let dataset of this.datasets) {
            if (dataset["id"] === id) {
                this.datasets.splice(
                    this.datasets.indexOf(dataset),
                    1,
                );
                break;
            }
        }
    }

    public performQuery(query: any): Promise<any[]> {
        Log.trace("Step 1: Check grammar");
        let checkerResult = this.syntaxChecker.isInputQueryValid(query);
        if (typeof checkerResult === "string") {
            return Promise.reject(new InsightError(checkerResult));
        }

        Log.trace("Step 2: Set dataset");
        let datasetToUse: Dataset = null;
        let establishResult = this.syntaxChecker.queryEstablishDataset( query, this.datasets);
        if (typeof establishResult === "string") {
            return Promise.reject(new InsightError(establishResult));
        }
        datasetToUse = establishResult;

        Log.trace("Step 3: Check query semantics");
        let optionsValidResult = this.semanticsChecker.semanticsAreValid( query, datasetToUse);
        if (typeof optionsValidResult === "string") {
            return Promise.reject(new InsightError(optionsValidResult));
        }

        Log.trace("Step 4: Run the query");
        let runQueryResult = this.runQuery.runQuery(query, datasetToUse);

        // ================== ERROR HANDLER ================== //
        if (typeof runQueryResult === "string") {
            Log.trace( "Reached Error Handler");
            // RESULT TOO LARGE
            if (runQueryResult === "Too large") {
                let errMsg =
                    "Result too big. Only queries with a maximum of 5000 results are supported";
                return Promise.reject(new ResultTooLargeError(errMsg));
            }

            // GENERAL ERROR
            return Promise.reject(new InsightError(runQueryResult));
        }

        // ===================== NO ERROR ==================== //
        return Promise.resolve(runQueryResult);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let insightDatasets: InsightDataset[] = [];
        for (let dataset of this.datasets) {
            const insightDataset: InsightDataset = {
                id: dataset["id"],
                kind: dataset["kind"],
                numRows: Dataset.getNumRows(dataset["kind"], dataset["data"]),
            };
            insightDatasets.push(insightDataset);
        }
        return Promise.resolve(insightDatasets);
    }
}
