import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,

    NotFoundError,
    ResultTooLargeError
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

    public addDataset(
        id: string,
        content: string,
        kind: InsightDatasetKind,
    ): Promise<string[]> {
        if (this.datasetHelper.idValid(id) &&
            kind === InsightDatasetKind.Courses &&
            !this.datasetHelper.idInDatasets(id, this.datasets)) {
            return this.datasetHelper.readContent(content)
                .catch((err: any) => {
                    return Promise.reject(new InsightError(err));
                })
                .then((courses: Course[]) => {
                    return new Dataset(id, kind, courses);
                })
                .then((dataset: Dataset) => {
                    return dataset.filterInvalidSections();
                })
                .then((dataset: Dataset) => {
                    return dataset.checkCoursesNotEmpty();
                })
                .catch((err: any) => {
                    return Promise.reject(err);
                })
                .then((dataset: Dataset) => {
                    this.datasets.push(dataset);
                })
                .then((result: void) => {
                    return this.datasetHelper.writeToDisk(this.datasets);
                })
                .catch((err: any) => {
                    return Promise.reject(err);
                })
                .then((val: any) => {
                    return this.datasetHelper.getIds(this.datasets);
                });
        } else {
            return Promise.reject(new InsightError("testing"));
            // return Promise.reject(new InsightError(this.datasetHelper.diagnoseIssue(id, kind, this.datasets)));
        }
    }

    public removeDataset(id: string): Promise<string> {
        if (this.datasetHelper.idValid(id)) {
            if (this.datasetHelper.idInDatasets(id, this.datasets)) {
                this.datasetHelper.removeFromDisk(id)
                    .then((result: void) => {
                        for (let dataset of this.datasets) {
                            if (dataset["id"] === id) {
                                this.datasets.splice(this.datasets.indexOf(dataset), 1);
                                break;
                            }
                        }
                    });
                return Promise.resolve(id);
            }
            return Promise.reject(new NotFoundError("tried to remove nonexistent dataset"));
        }
        return Promise.reject
        (new InsightError(this.datasetHelper.diagnoseIssue(id, InsightDatasetKind.Courses, this.datasets)));
    }

    /** Note: Any errors will be passed on as strings */
    public performQuery(query: any): Promise <any[]> {
        /** Step1: Check grammar */
        let checkerResult = this.preQuery.isInputQueryValid(query);
        if (typeof checkerResult === "string") {
            return Promise.reject(new InsightError(checkerResult)); }

        /** Step2: Set dataset */
        let datasetToUse: Dataset = null;
        let establishResult = this.preQuery.queryEstablishDataset(query, this.datasets);
        if (typeof establishResult === "string") {
            return Promise.reject(new InsightError(establishResult)); }
        datasetToUse = establishResult;

        /** Step3: Check query semantics */
        let optionsValidResult = this.preQuery.inputOptionsKeysAreValid(query, datasetToUse);
        if (typeof optionsValidResult === "string") {
            return Promise.reject(new InsightError((optionsValidResult))); }

        /** step4: run the query */
        let runQueryResult = this.runQuery.runQuery(query, datasetToUse);

        // ================== ERROR HANDLER ================== //
        if (typeof runQueryResult === "string") {

            // RESULT TOO LARGE
            if (runQueryResult === "Too large") {
                let errMsg = "Result too big. Only queries with a maximum of 5000 results are supported";
                return Promise.reject(new ResultTooLargeError(errMsg)); }

            // GENERAL ERROR
            return Promise.reject(new InsightError((runQueryResult)));
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
