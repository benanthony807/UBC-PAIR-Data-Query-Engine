import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError,
} from "./IInsightFacade";
import Dataset from "./Dataset";
import DatasetHelper from "./DatasetHelper";
import Course from "./Course";
import PQPreQuery from "./PQPreQuery";
import PQRunQuery from "./PQRunQuery";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private datasets: Dataset[];
    private datasetHelper: DatasetHelper;
    private runQuery: PQRunQuery;
    private preQuery: PQPreQuery;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = [];
        this.datasetHelper = new DatasetHelper();
        this.runQuery = new PQRunQuery();
        this.preQuery = new PQPreQuery();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (this.datasetHelper.isAddableDataset(id, kind, this.datasets)) {
            Log.trace("dataset has valid id, kind, and is not already added");
            return this.datasetHelper
                .readContent(content)
                .then((courses: Course[]) => {
                    let dataset: Dataset = new Dataset(id, kind, courses);
                    dataset.filterInvalidSections();
                    Log.trace("filtered invalid sections from dataset");
                    return dataset.checkCoursesNotEmpty();
                })
                .then((dataset: Dataset) => {
                    Log.trace("dataset has at least one valid section");
                    this.datasets.push(dataset);
                    this.datasetHelper.writeToDisk(this.datasets);
                    Log.trace("dataset pushed to cache and written to disk");
                    return this.datasetHelper.getIds(this.datasets);
                })
                .catch((err: any) => {
                    Log.trace("something went wrong, got to addDataset catch block");
                    return Promise.reject(err);
                });
        } else {
            Log.trace("dataset is invalid, either has invalid id, kind, or has already been added");
            return Promise.reject(new InsightError(this.datasetHelper.diagnoseIssue(id, kind, this.datasets)));
        }
    }

    public removeDataset(id: string): Promise<string> {
        if (this.datasetHelper.idValid(id)) {
            Log.trace("dataset has valid id");
            if (this.datasetHelper.idInDatasets(id, this.datasets)) {
                Log.trace("dataset is in datasets and not already removed");
                this.datasetHelper.removeFromDisk(id);
                Log.trace("dataset removed from disk");
                this.removeFromCache(id);
                Log.trace("dataset removed from cache");
                return Promise.resolve(id);
            }
            Log.trace("dataset wasn't found in array of previously added datasets");
            return Promise.reject(
                new NotFoundError("tried to remove nonexistent dataset"));
        }
        Log.trace("dataset has an invalid id");
        return Promise.reject(
            new InsightError(this.datasetHelper.diagnoseIssue(id, InsightDatasetKind.Courses, this.datasets)));
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
        Log.trace("Step1: Check grammar");
        let checkerResult = this.preQuery.isInputQueryValid(query);
        if (typeof checkerResult === "string") {
            return Promise.reject(new InsightError(checkerResult));
        }

        Log.trace("Step2: Set dataset");
        let datasetToUse: Dataset = null;
        let establishResult = this.preQuery.queryEstablishDataset(
            query,
            this.datasets,
        );
        if (typeof establishResult === "string") {
            return Promise.reject(new InsightError(establishResult));
        }
        datasetToUse = establishResult;

        Log.trace("Step3: Check query semantics");
        let optionsValidResult = this.preQuery.inputOptionsKeysAreValid(
            query,
            datasetToUse,
        );
        if (typeof optionsValidResult === "string") {
            return Promise.reject(new InsightError(optionsValidResult));
        }

        Log.trace("Step 4: Run the query");
        let runQueryResult = this.runQuery.runQuery(query, datasetToUse);

        // ================== ERROR HANDLER ================== //
        Log.trace( "Reached Error Handler");
        if (typeof runQueryResult === "string") {
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
                numRows: dataset.getNumRows(),
            };
            insightDatasets.push(insightDataset);
        }
        return Promise.resolve(insightDatasets);
    }
}
