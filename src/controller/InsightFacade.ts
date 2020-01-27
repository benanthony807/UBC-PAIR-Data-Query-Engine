import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import PerformQueryHelper from "./PerformQueryHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private performQueryHelper: PerformQueryHelper;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return Promise.reject("Not implemented.");
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        let dataSetIDToUse = null;
        let datasetToUse = null;
        return Promise.reject("Not implemented."); // comment out

        /**
         * Step1: Check the grammar and semantics
         * Semantics: ORDER's key (type string) is the column name to sort on and must be in COLUMNS array
         */
        if (this.performQueryHelper.inputQueryIsValid(query)) {
            /**
             * Step2: Set the dataset
             * 1. Look in datasets, which is a list of Dataset
             * 2. If we find the dataset with the id we want, set datasetToUse to be that dataset
             * 3. Otherwise do a promise reject because we can't find the dataset
             */
            // Dataset class does exist, just need to merge with Ben's commit

            // dataSetIDToUse = "courses";
            // indexOfDataset = datasets.indexOf(dataSetIDToUse);
            // if (indexOfDataset === -1) { //indexOf returns -1 if target value is not found
            //     Promise.reject("dataset not found");
            // } else {
            //     datasetToUse = datasets[indexOfDataset];
            // }

            /**
             * Step3: Now that the dataset is loaded, the query keys can be validated against the dataset
             * Semantic checks in order:
             * Check if the first key in COLUMNS is loaded
             * Check if the other keys are different from COLUMNS (if so, then cannot reference more than one dataset)
             * Check if query keys are one of the 8 keys we accept
             */

             // if (this.performQueryHelper.inputKeysAreValid(query, datasetToUse)) {
             //
             //    /**
             //     * Step4: Store the query in a structure such that the query can be performed.
             //     * The hierarchy should match the incoming JSON
             //     */
             //    // this.performQueryHelper.storeQuery(query);
             //
             //    /**
             //     * Step5: Run the query
             //     */
             //    // this.performQueryHelper.runQuery(query, dataSet);
             // }


        }

    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");

    }
}
