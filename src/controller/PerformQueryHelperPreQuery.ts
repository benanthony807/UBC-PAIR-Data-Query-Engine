import Dataset from "./Dataset";
import {InsightError} from "./IInsightFacade";

export default class PerformQueryHelperPreQuery {

    public errorMessage: string;
    public dataSetID: string;
    public filteredResults: any[];
    public allSectionsInDataset: any[];
    public listOfAcceptableKeyFields: string[];
    public OrderKey: string;

    constructor() {
        this.errorMessage = "";
        this.dataSetID = "courses"; // "courses" by default
        this.filteredResults = [];
        // filled out all sections in dataset for testing
        this.allSectionsInDataset = [];
        this.listOfAcceptableKeyFields = [
            "courses_dept",
            "courses_id",
            "courses_avg",
            "courses_instructor",
            "courses_title",
            "courses_pass",
            "courses_fail",
            "courses_audit",
            "courses_uuid",
            "courses_year"];
    }

    // Helper functions

    /**
     * inputQueryIsValid checks if the input query meets syntax requirements
     * incorrect formatting rejects with InsightError describing the error
     */
    public inputQueryIsValid(query: any): boolean {
        // Check if the query is a non-null object
        if (typeof query === null || typeof query === "undefined") {
            this.errorMessage = "Query was found to be null or 'undefined'";
            return false;
        } else {
            if (this.hasBodyAndOptions(query)) {
                return this.hasValidOptionsGrammar(query);
            } else {
                return false;
            }
        }
    }

    /** inputQueryIsValid helper method
     * true if input query's first key is "WHERE" and second key is "OPTIONS"
     */
    public hasBodyAndOptions(query: any): boolean {

        // Step 1: Query should have two keys
        if (Object.keys(query).length !== 2) {
            this.errorMessage = "Query should have two root keys";
            return false; }
        // Step 2: Query's first key should be "WHERE"
        if (Object.keys(query)[0] !== "WHERE") {
            this.errorMessage = "Missing WHERE";
            return false;
            // Step 3: Query's second key should be "OPTIONS"
            } else if (Object.keys(query)[1] !== "OPTIONS") {
                this.errorMessage = "Missing OPTIONS";
                return false;
            // Step 4: possibly redundant, but make sure there are exactly two keys the way we want them to be
            } else if (Object.keys(query)[0] === "WHERE" && Object.keys(query)[1] === "OPTIONS") {
                return true;
            }
    }

    /** inputQueryIsValid helper method
     * true if OPTIONS grammar is valid:
     *  - Must have ONE "COLUMNS"
     *      - COLUMNS can have identical child keys
     *  - See hasValidOptionsGrammar helper method for ORDER spec
     */
    public hasValidOptionsGrammar(query: any) {
        // OPTIONS must have one or two keys
        if (Object.keys(query["OPTIONS"]).length === 1 || Object.keys(query["OPTIONS"]).length === 2) {
            // The first key should be "COLUMNS"
            if (Object.keys(query["OPTIONS"])[0] === "COLUMNS") {
                // Columns must not be empty
                if (Object.keys(query["OPTIONS"]["COLUMNS"]).length === 0) {
                    this.errorMessage = "COLUMNS must be a non-empty array";
                    return false;
                } else {
                    // if there is a second key
                    if (Object.keys(query["OPTIONS"]).length === 2) {
                        // return the result of isOrderValid (true or false)
                        if (this.isOrderValid(query)) {
                            return true;
                        } else {
                            return false;
                        }
                    } else { // there is no second key
                        return true;
                    }
                }
            } else {
                this.errorMessage = "OPTIONS missing COLUMNS";
                return false;
            }
        } else {
            this.errorMessage = "OPTIONS must have one or two keys";
            return false;
        }
    }

    /** hasValidOptionsGrammar helper method
     *  ORDER is optional, but can only have one ORDER if exists
     *    - ORDER must have exactly one child key
     *    - the child key must be one of the column's child keys
     */
    private isOrderValid(query: any) {

        // the order key must be called "ORDER"
        if (Object.keys(query["OPTIONS"])[1] === "ORDER") {

            // The order key must not have a list as a value / must be a string
            if (typeof query["OPTIONS"]["ORDER"] === "string") {
                let orderValue = query["OPTIONS"]["ORDER"]; // ex. courses_avg
                let columns = query["OPTIONS"]["COLUMNS"]; // sets columns to be the list of fields in "COLUMNS"

                // the order value must be in COLUMNS
                if (columns.includes(orderValue)) {
                    return true;
                } else {
                    this.errorMessage = "ORDER key: " + orderValue + " must be in COLUMNS";
                    return false;
                }
            } else {
                this.errorMessage = "Invalid ORDER type (ORDER must be a string)";
                return false;
            }
        } else {
            this.errorMessage = "Invalid keys in OPTIONS (cannot find ORDER)";
            return false;
        }

    }

    /**
     * Finds the dataset we want to use in the datasets cache
     * Lets the caller continue knowing that the dataset exists in the cache via
     * passing the dataset through resolve
     * Stores the field this.dataSetID to be the existent dataset
     */
    public queryEstablishDataset(query: any, datasets: Dataset[]): any {
            let keyVal = query["OPTIONS"]["COLUMNS"][0];
            let datasetIDToUse = keyVal.substring(0, keyVal.indexOf("_"));
            for (let dataset of datasets) {
                if (dataset["id"] === datasetIDToUse) {
                    this.dataSetID = datasetIDToUse; // sets the class field dataSetID
                    return dataset; } }
            // Reach this point if no matching dataset is found
            return "Dataset not found";
        }

    /**
     * inputKeysAreValid returns true if three semantic checks are passed:
     * Semantic checks in order:
     * Check if the first key in COLUMNS is loaded
     * Check if the other keys are different from COLUMNS (if so, then cannot reference more than one dataset)
     * Check if query keys are one of the 8 keys we accept
     */
    public inputOptionsKeysAreValid(query: any, datasetToUse: Dataset): any {
        // Check if first key in COLUMNS is loaded
        if (this.keyIsLoaded(query, datasetToUse)) {

            // Check if all keys in inputOptions match the dataset ID (ex. "courses")
            if (this.ColumnAndOrderKeysAreValid(query)) {
                return query;
            } else {
                this.errorMessage = "Invalid key in COLUMNS or ORDER";
                return this.errorMessage;
            }

            // first key in COLUMNS is not loaded
        } else {
            this.errorMessage = "Referenced dataset " + "'" + datasetToUse["id"] + "'" + " not added yet";
            return this.errorMessage;
        }
    }

    /**
     * Helper function for inputOptionsKeysAreValid
     * Check if key is loaded
     * The first key in COLUMNS is the key we're going to load
     */
    private keyIsLoaded(query: any, datasetToUse: Dataset): boolean {
        let firstItem = query["OPTIONS"]["COLUMNS"][0]; // ex. "courses_avg"
        let inputKey = firstItem.substring(0, firstItem.indexOf("_")); // isolates the id, ex. "courses"
        return inputKey === datasetToUse["id"];
    }

    /**
     * Helper function for inputOptionsKeysAreValid
     * Check if COLUMN and ORDER keys match the dataset ID (ex. "courses")
     */
    private ColumnAndOrderKeysAreValid(query: any): boolean {
        // step 1: check columns: go through every key_value in COLUMNS: ex. [courses_avg, courses_dept]
        for (let keyId of query["OPTIONS"]["COLUMNS"]) {
            // isolate the key
            let key = keyId.substring(0, keyId.indexOf("_")); // ex. courses_avg -> courses
            // check if it matches the ID we're using
            if (key !== this.dataSetID) {
                return false;
            }
        }

        // reaches this point if COLUMNS are okay
        // step 2: check ORDER
        let orderID = query["OPTIONS"]["ORDER"];
        let orderKey = orderID.substring(0, orderID.indexOf("_"));
        return orderKey === this.dataSetID;
    }

}

// TODO: Ask about var that = this;
