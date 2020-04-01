import Dataset from "./dataset/Dataset";
import Log from "../Util";
import PQGeneralHelpers from "./PQGeneralHelpers";
import PQPreQTransfChecker from "./PQPreQTransfChecker";

export default class PQPreQSemantics {
    private helpers: PQGeneralHelpers;
    private transfChecker: PQPreQTransfChecker;
    private errorMessage: string = "";

    constructor() {
        this.helpers = new PQGeneralHelpers();
        this.transfChecker = new PQPreQTransfChecker();
    }

    /** Checks semantic requirements in COLUMN and ORDER */
    public semanticsAreValid(query: any, datasetToUse: Dataset): any {
        // Step 0: If TRANSFORMATIONS exists, Populate APPLY keys for ORDER and APPLY check downstream:
        if (Object.keys(query).length === 3) {
            this.transfChecker.populateListOfApplyKeys(query);
        }

        // Step 1: First key in COLUMNS is the dataset we're using
        if (!this.isKeyLoaded(query, datasetToUse)) {
            this.errorMessage = "Referenced dataset " + "'" + datasetToUse["id"] + "'" + " not added yet";
            return this.errorMessage;
        }
        // Step 2: Check if COLUMNS and ORDER keyIDs match the dataset ID (ex. "courses", "rooms")
        if (!this.areColumnAndOrderKeysValid(query)) {
            return this.errorMessage;
        }

        if (Object.keys(query).length === 3) {
            // Step 3: If TRANSFORMATIONS exists, check if GROUP is valid
            if (!this.transfChecker.isGroupSemanticsValid(query)) {
                return this.transfChecker.errorMessage;
            }

            // Step 4: If TRANSFORMATIONS exists, check if APPLY is valid
            if (!this.transfChecker.isApplySemanticsValid(query)) {
                return this.transfChecker.errorMessage;
            }
        }
    }

    /**
     * Checks if the key we're using is loaded:
     *      ex. {"COLUMNS": []"courses_avg"] | queryKey = "courses" | datasetToUse = "courses"}
     */
    private isKeyLoaded(query: any, datasetToUse: Dataset): boolean {
        let firstItem = "";
        // If no TRANSFORMATIONS, first item will be first key in COLUMNS
        if (Object.keys(query).length === 2) {
            firstItem = query["OPTIONS"]["COLUMNS"][0]; // ex. "courses_avg", "rooms_type"
        }
        // If yes TRANSFORMATIONS, first item will be first key in GROUP
        if (Object.keys(query).length === 3) {
            firstItem = query["TRANSFORMATIONS"]["GROUP"][0]; // ex. "courses_avg", "rooms_type"
        }

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
        // If it has an _ then look at the dataSetID
        if (orderKey.indexOf("_") !== -1) {
            let orderID = orderKey.substring(0, orderKey.indexOf("_")); // courses_avg -> courses
            if (orderID !== this.helpers.getDataSetID()) {
                return false;
            }

            let orderField = orderKey.substring(orderKey.indexOf("_") + 1, orderKey.length); // ex. courses_avg -> avg
            return PQGeneralHelpers.listOfAcceptableFields.includes(orderField);
        }

        // At this point the orderKey does not have an _, so look at APPLY's keys
        return PQPreQTransfChecker.listOfApplyKeys.includes(orderKey);

    }

    public checkColumnSemantics(query: any): boolean {
        let listOfApplyItemsPreFlat: any = [];
        let listOfApplyItems: any = [];
        // If there is an APPLY, populate a list of APPLY items
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

                // If there is a TRANSFORMATIONS...
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
                        this.errorMessage = "key has an underscore so must be in GROUP";
                        return false;
                    }
                }
            }
        }
        return true;
    }
}
