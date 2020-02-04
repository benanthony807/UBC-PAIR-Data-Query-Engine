import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
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
    private performQueryHelperPreQuery: PerformQueryHelperPreQuery;
    private performQueryHelperQuery: PerformQueryHelperQuery;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = [];
        this.datasetHelper = new DatasetHelper();
        this.performQueryHelperPreQuery = new PerformQueryHelperPreQuery();
        this.performQueryHelperQuery = new PerformQueryHelperQuery();
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
            return Promise.reject(new InsightError(this.datasetHelper.diagnoseIssue(id, kind, this.datasets)));
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
        let dataSetIDToUse: string = "courses";
        let datasetToUse: Dataset = null;
        // return Promise.reject("Not implemented."); // for pushing
        /**
         * Step1: Check the query grammar
         */
        if (this.performQueryHelperPreQuery.inputQueryIsValid(query)) {
            /**
             * Step2: Set the dataset we're going to use
             */
            return this.performQueryHelperPreQuery.queryEstablishDataset(dataSetIDToUse, this.datasets)
                .catch((err: any) => { // the err passed is "Dataset not found"
                return Promise.reject(new InsightError(err));
                })
                .then((dataset: Dataset) => {
                    datasetToUse = dataset;
                    return this.performQueryHelperPreQuery.inputOptionsKeysAreValid(query, datasetToUse);
                })
                /**
                 * Step3: Semantic check if input keys are valid
                 * NOTE: At this step, I will only check if the OPTIONS keys are valid. ie. ORDER and COLUMNS.
                 * This is because OPTIONS will only be one deep.
                 * BODY/WHERE may have nested objects (AND -> OR -> AND etc) so they will have to be checked
                 * recursively. runQuery will do the recursive traversing and processing, so right before it
                 * processes a filter item (GT, IS, etc) it will do the semantic check.
                 */
                .catch((err: any) => {
                    return Promise.reject(new InsightError(this.performQueryHelperPreQuery.errorMessage));
                })
                .then((almostValidatedQuery: any) => {
                    return this.performQueryHelperQuery.runQuery(almostValidatedQuery, datasetToUse);
                    })
                .catch((errMsg) => {
                    return Promise.reject(new InsightError(this.performQueryHelperPreQuery.errorMessage));
                })
                .then((queriedList: any[]) => {
                    return Promise.resolve(queriedList);
                });
            } else {
            return Promise.reject(new InsightError(this.performQueryHelperPreQuery.errorMessage));
        }
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
