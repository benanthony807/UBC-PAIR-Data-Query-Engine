import Dataset from "./dataset/Dataset";
import Log from "../Util";
import PQGeneralHelpers from "./PQGeneralHelpers";

export default class PQPreQSemantics {
    private helpers: PQGeneralHelpers;
    private errorMessage: string = "";

    constructor() {
        this.helpers = new PQGeneralHelpers();
    }

    /** Checks semantic requirements in COLUMN and ORDER */
    public inputOptionsKeysAreValid(query: any, datasetToUse: Dataset): any {
        // Step 1: First key in COLUMNS is the dataset we're using
        if (!this.isKeyLoaded(query, datasetToUse)) {
            this.errorMessage = "Referenced dataset " + "'" + datasetToUse["id"] + "'" + " not added yet";
            return this.errorMessage;
        }

        // Step 2: Check if COLUMNS and ORDER keyIDs match the dataset ID (ex. "courses")
        if (!this.areColumnAndOrderKeysValid(query)) {
            return this.errorMessage;
        }

        // Log.trace("Pre-Query semantic checks passed");
        return true;
    }

    /**
     * Checks if the key we're using is loaded:
     *      ex. {"COLUMNS": []"courses_avg"] | queryKey = "courses" | is datasetToUse = "courses"}
     */
    private isKeyLoaded(query: any, datasetToUse: Dataset): boolean {
        let firstItem = query["OPTIONS"]["COLUMNS"][0]; // ex. "courses_avg"
        let queryKeyID = firstItem.substring(0, firstItem.indexOf("_")); // isolates the id, ex. "courses"
        return queryKeyID === datasetToUse["id"];
    }

    /**
     * Checks if COLUMN and ORDER keys match the dataset ID (ex. "courses")
     */
    public areColumnAndOrderKeysValid(query: any): boolean {
        // Step 0: Check null/undefined calls to be used downstream
        if (query["OPTIONS"] === undefined ||
            query["OPTIONS"] === null ||
            query["OPTIONS"]["COLUMNS"] === undefined ||
            query["OPTIONS"]["COLUMNS"] === null) {
            this.errorMessage = "query['OPTIONS'] or query['OPTIONS']['COLUMNS'] is null/undefined";
            return false;
        }

        // Step 1: Check COLUMNS id_field
        if (this.checkColumnSemantics(query) === false) {
            return false;
        }

        // Step 2: If ORDER exists, Check ORDER id_field
        if (Object.keys(query["OPTIONS"]).length === 2) {
            return this.checkOrderSemantics(query);
        }
        return true;
    }

    private checkOrderSemantics(query: any): boolean {
        let order = query["OPTIONS"]["ORDER"]; // "courses_avg"
        if (typeof order === "string") {
            return this.areIDAndFieldValid(order);
        }
        if (Object.keys(order).length === 2) {
            let orderKeys = order["keys"]; // ["courses_avg", "courses_dept"]
            for (let key of orderKeys) {
                if (this.areIDAndFieldValid(key) === false) {
                    return false;
                }
            }
        }
        // Passed all checks
        return true;
    }

    public areIDAndFieldValid(orderKey: string): boolean {
        let orderID = orderKey.substring(0, orderKey.indexOf("_")); // courses_avg -> courses
        if (orderID !== this.helpers.getDataSetID()) {
            return false;
        }

        let orderField = orderKey.substring( orderKey.indexOf("_") + 1, orderKey.length); // ex. courses_avg -> avg
        // return this.helpers.listOfAcceptableFields.includes(orderField);
        return PQGeneralHelpers.listOfAcceptableFields.includes(orderField);
    }

    public checkColumnSemantics(query: any): boolean {
        let listOfApplyItemsPreFlat: any = [];
        let listOfApplyItems: any = [];
        if (Object.keys(query).length === 3 && Object.keys(query["TRANSFORMATIONS"])[1] === "APPLY") {
            let numApplyKeys = query["TRANSFORMATIONS"]["APPLY"].length;
            for (let i = 0; i < numApplyKeys; i++) {
                listOfApplyItemsPreFlat.push(Object.keys(query["TRANSFORMATIONS"]["APPLY"][i]));
            }
            listOfApplyItems = listOfApplyItemsPreFlat.flat(); // turns [ [item1], [item2] ] into [ item1, item2 ]
        }

        // Iterate through each COLUMNS id_field item ex. [ "courses_avg", "overallAvg" ]
        for (let key of query["OPTIONS"]["COLUMNS"]) {

            if (Object.keys(query).length === 2) {
                let result = this.helpers.keyIsValidColumnUnderscoreItem(key);
                if (typeof result === "string") {
                    this.errorMessage = result;
                    return false;
                }
            } else if (Object.keys(query).length === 3) {
                // Step 1: If no _, item must be in APPLY (APPLY won't have any _ in it).
                if (key.indexOf("_") === -1) {
                    if (listOfApplyItems.indexOf(key) === -1) {
                        this.errorMessage = "Column key does not have an underscore so must be in APPLY";
                        return false;
                    }
                } else if (key.indexOf("_") !== -1) {
                    let result2 = this.helpers.keyIsValidColumnUnderscoreItem(key);
                    if (typeof result2 === "string") {
                        this.errorMessage = result2;
                        return false;
                    }
                    let group = query["TRANSFORMATIONS"]["GROUP"];
                    if (!group.includes(key)) {
                        this.errorMessage = "key has no underscore so must be in GROUP";
                        return false;
                    }
                }
            }
        }
        return true;
    }
}
