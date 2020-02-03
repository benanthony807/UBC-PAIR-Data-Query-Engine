import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import Dataset from "./Dataset";
import DatasetHelper from "./DatasetHelper";
import Course from "./Course";
import PerformQueryHelper from "./PerformQueryHelper";
import {resolve} from "dns";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private datasets: Dataset[];
    private datasetHelper: DatasetHelper;
    private performQueryHelper: PerformQueryHelper;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = [];
        this.datasetHelper = new DatasetHelper();
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
        let dataSetIDToUse = null;
        let datasetToUse = null;
        return Promise.reject("Not implemented."); // for pushing
        // return new Promise((resolve, reject)) =>
        // {
        //     /**
        //      * Step1: Check the grammar and semantics
        //      * Semantics: ORDER's key (type string) is the column name to sort on and must be in COLUMNS array
        //      */
        //     if (this.performQueryHelper.inputQueryIsValid(query)) {
        //
        //         /**
        //          * Step2: Set the dataset
        //          * 1. Look in datasets, which is a list of Dataset
        //          * 2. If we find the dataset with the id we want, set datasetToUse to be that dataset
        //          * 3. Otherwise do a promise reject because we can't find the dataset
        //          */
        //         dataSetIDToUse = "courses";
        //         let indexOfDataset = this.datasets.indexOf(dataSetIDToUse);
        //         if (indexOfDataset === -1) { //indexOf returns -1 if target value is not found
        //             return Promise.reject("dataset not found");
        //         } else {
        //             datasetToUse = this.datasets[indexOfDataset]; //now datasetToUse will use courses
        //         }
        //
        //         /**
        //          * Step3: Now that the dataset is loaded, the query keys can be validated against the dataset
        //          */
        //         if (this.performQueryHelper.inputKeysAreValid(query, datasetToUse)) {
        //
        //
        //             /**
        //              * Step4: Store the query in a structure such that the query can be performed.
        //              * The hierarchy should match the incoming JSON
        //              * per TA: this means we need to be able to go through a layer of comparators
        //              *
        //              *
        //              */
        //             let structuredQuery = this.performQueryHelper.structureQuery(query);
        //
        //             /**
        //              * Step5: Run the query
        //              */
        //             this.performQueryHelper.runQuery(query /* or structuredQuery */, datasetToUse)
        //                 .then((queryResult) => {
        //                     return Promise.resolve(queryResult)
        //                 })
        //         }
        //     }
        // }
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
