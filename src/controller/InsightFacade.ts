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
import PerformQueryHelperPreQuery from "./PerformQueryHelperPreQuery";
import PerformQueryHelperQuery from "./PerformQueryHelperQuery";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private datasets: Dataset[];
    private datasetHelper: DatasetHelper;
    private performQueryHelperQuery: PerformQueryHelperQuery;
    private performQueryHelperPreQuery: PerformQueryHelperPreQuery;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = [];
        this.datasetHelper = new DatasetHelper();
        this.performQueryHelperQuery = new PerformQueryHelperQuery();
        this.performQueryHelperPreQuery = new PerformQueryHelperPreQuery();
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

    public performQuery(query: any): Promise <any[]> {
        let datasetToUse: Dataset = null;
        // return Promise.reject("Not implemented."); // for pushing
        /** Step1: Check the query grammar */
        if (this.performQueryHelperPreQuery.inputQueryIsValid(query)) {
            /** Step2: Set the dataset we're going to use */

            let establishResult = this.performQueryHelperPreQuery.queryEstablishDataset(query, this.datasets);
            if (typeof establishResult === "string") {
                return Promise.reject(new InsightError(establishResult));
            } else {
                datasetToUse = establishResult;

                /** Step3: Semantic check if input keys are valid */
                let optionsValidResult = this.performQueryHelperPreQuery.inputOptionsKeysAreValid(query, datasetToUse);
                if (typeof optionsValidResult === "string") {
                    return Promise.reject(new InsightError((optionsValidResult)));
                } else {

                    /** step4: run the query */
                    let runQueryResult = this.performQueryHelperQuery.runQuery(optionsValidResult, datasetToUse);
                    // ERROR RECEIVED
                    if (typeof runQueryResult === "string") {
                        // RESULT TOO LARGE
                        if (runQueryResult === "Too large") {
                            let errMsg = "Result too big. Only queries with a maximum of 5000 results are supported";
                            return Promise.reject(new ResultTooLargeError(errMsg));
                        } else { return Promise.reject(new InsightError((runQueryResult))); }
                    // NO ERROR
                    } else {
                        return Promise.resolve(runQueryResult);

                            // // must return a string ?
                            // if (typeof queriedList !== "string") {
                            //     queriedList.toString();
                            // }
                    }
                }
            }
        }
        return Promise.reject(new InsightError("query is not valid"));
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

// TODO: Why is ORDER test failing even though it looks like it's returning the same thing as expected
// TODO: Why is Reject: IS has two keys failing even though it looks like it's returning the same thing as expected
// TODO: PerformQueryHelperQueryTest has lint error
// TODO: Why is LT failing in smokescreen
