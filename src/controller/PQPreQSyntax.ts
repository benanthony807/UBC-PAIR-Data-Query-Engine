import Dataset from "./dataset/Dataset";
import Log from "../Util";
import * as assert from "assert";
import PQGeneralHelpers from "./PQGeneralHelpers";
import PQPreQTransfChecker from "./PQPreQTransfChecker";

export default class PQPreQSyntax {
    public errorMessage: string;
    public filteredResults: any[];
    public helpers: PQGeneralHelpers;
    private transformation: PQPreQTransfChecker;

    constructor() {
        this.errorMessage = "";
        this.filteredResults = [];
        this.helpers = new PQGeneralHelpers();
        this.transformation = new PQPreQTransfChecker();
    }

    // ================================== SYNTAX CHECKS ================================== //

    /**
     * Checks syntax requirements
     * Input: query: {WHERE: ..., OPTIONS: ... (, TRANSFORMATIONS: ...)}
     * Output: string with error message if error
     */
    public isInputQueryValid(query: any): any {
        // Step 1: Query should not be null or undefined
        if (query === null || query === undefined) {
            this.errorMessage = "Query was found to be null or 'undefined'";
            return this.errorMessage;
        }

        let qLength = Object.keys(query).length;
        // Step 1.5: Query must have 2 or 3 keys
        if (!(qLength === 2 || qLength === 3)) {
            this.errorMessage = "Query must have 2 or 3 keys. Currently has: " + qLength;
            return this.errorMessage;
        }

        // Step 2: Query has two or three keys: WHERE and OPTIONS (and TRANSFORMATIONS)
        Log.trace("Length of query " + qLength);
        if (qLength === 2) {
            if (!(Object.keys(query)[0] === "WHERE" && Object.keys(query)[1] === "OPTIONS")) {
                this.errorMessage = "Query has " + qLength + " keys. They must be WHERE and OPTIONS";
                return this.errorMessage;
            }
        }
        if (qLength === 3) {
            if (!(Object.keys(query)[0] === "WHERE" &&
                Object.keys(query)[1] === "OPTIONS" &&
                Object.keys(query)[2] === "TRANSFORMATIONS")) {
                this.errorMessage = "Query has " + qLength + " keys. " +
                    "There must be Three keys: WHERE, OPTIONS, and TRANSFORMATIONS";
                return this.errorMessage;
            }
            // Step 3: If there is a TRANSFORMATIONS key, check its grammar
            let isTransformationValidResult = this.transformation.isTransformationsValid(query);
            if (typeof isTransformationValidResult === "string") {
                this.errorMessage = isTransformationValidResult;
                return this.errorMessage;
            }
        }

        // Step 4: Check WHERE and OPTIONS grammar
        if (!(this.isWhereValid(query) && this.isOptionsValid(query))) {
            return this.errorMessage;
        }

        Log.trace("Input query is valid");
        return true;
    }

    /**
     * Checks WHERE grammar
     * Conditions: WHERE must have <= 1 keys. Below are valid:
     *      ex. {"WHERE": {"AND": ...}}
     *      ex. {"WHERE": {}}
     */
    public isWhereValid(query: any): boolean {
        if (query["WHERE"] === null || Array.isArray(query["WHERE"])) {
            return false;
        }
        return Object.keys(query["WHERE"]).length <= 1;
    }

    /**
     * Checks OPTIONS grammar
     * Conditions: OPTIONS must have one or two keys and first key must be COLUMNS:
     *      ex. {"OPTIONS": {"COLUMNS": [...], "ORDER": ...}}
     *      ex. {"OPTIONS": {"COLUMNS": [...]}}
     * Conditions: COLUMNS can have identical child keys:
     *      ex. {"OPTIONS": {"COLUMNS": ["courses_avg", "courses_avg"]}}
     */
    public isOptionsValid(query: any): boolean {
        let options = query["OPTIONS"];
        // Step 1: OPTIONS is not undefined / null
        if (options === undefined || options === null) {
            this.errorMessage = "ERROR: OPTIONS is undefined / null";
            return false;
        }

        // Step 2: OPTIONS has one or two keys
        if (
            !(
                Object.keys(options).length === 1 ||
                Object.keys(options).length === 2
            )
        ) {
            this.errorMessage = "ERROR: OPTIONS does not have one or two keys";
            return false;
        }

        // Step 3: OPTIONS first key is COLUMNS
        if (Object.keys(options)[0] !== "COLUMNS") {
            this.errorMessage = "ERROR: First key in OPTIONS  not COLUMNS";
            return false;
        }

        // Step 4: COLUMNS must not be null / undefined / empty
        let columns = query["OPTIONS"]["COLUMNS"];
        if (
            columns === null ||
            columns === undefined ||
            Object.keys(columns).length === 0
        ) {
            this.errorMessage = "ERROR: COLUMNS must not be null / undefined / empty";
            return false;
        }

        // Step 5: If ORDER exists, it must be valid
        if (Object.keys(options).length === 2) {
            let isOrderValidResult = this.isOrderValid(query);
            if (typeof isOrderValidResult === "string") {
                this.errorMessage = isOrderValidResult;
                return false;
            }
        }

        return true;
    }

    /**
     *  Checks ORDER grammar
     *  Conditions: ORDER must have exactly one child key
     *  Conditions: Child key must be one of the column's child keys
     */
    public isOrderValid(query: any): any {
        let columns = query["OPTIONS"]["COLUMNS"]; // ex. ["courses_avg", "courses_dept", ...]

        // Step 1: ORDER key must be called "ORDER"
        // Note: options has already been checked for null/undefined upstream
        if (Object.keys(query["OPTIONS"])[1] !== "ORDER") {
            return "ERROR: Second key in OPTIONS must be ORDER";
        }
        let order = query["OPTIONS"]["ORDER"];

        // Step 2: If ORDER key is a string...
        //      VALID:      ex. "ORDER": "courses_avg"
        //      INVALID:    ex. "ORDER": ["courses_avg"]
        if (typeof order === "string") {
            // ORDER key is in COLUMNS
            //      VALID:      ex. {"COLUMNS": ["courses_avg", "courses_dept"], "ORDER": "courses_avg"}
            //      INVALID:    ex. {"COLUMNS": ["courses_avg", "courses_dept"], "ORDER": "courses_id"}
            let orderValue = order; // ex. "courses_avg"
            if (!columns.includes(orderValue)) {
                return "ORDER key: " + orderValue + " must be in COLUMNS";
            }
            return true;
        }

        // Step 2: If ORDER key is an object that's not a list
        // ex. ORDER: {dir: "DOW", keys: ["courses_avg"]}
        if (!(typeof order === "object" && !Array.isArray(order))) {
            return "ORDER must be a non-array object";
        }

        // Step 3: There must be two keys
        if (Object.keys(order).length !== 2) {
            return "Order key is not just a string, so it must have two keys";
        }

        // Step 4: The first key must be dir, the second key must be keys
        let firstKey = Object.keys(order)[0];
        let secondKey = Object.keys(order)[1];
        if (!(firstKey === "dir" && secondKey === "keys")) {
            return "first key must be dir and second key must be keys";
        }

        // Step 5: dir must be UP or DOWN
        let dirValue = Object.values(order)[0];
        if (!(dirValue === "UP" || dirValue === "DOWN")) {
            return "dir must be UP or DOWN, instead got... " + dirValue;
        }

        // Step 6: "keys" must a non-empty array
        if (!Array.isArray(order["keys"])) {
            return "'keys' key in ORDER must be an array";
        }
        if (order["keys"].length < 1) {
            return "'keys' key in ORDER must not be empty";
        }

        // Step 7: values in "keys" must be in COLUMNS
        let keysValues: any; // Must explicitly state keysValue is of type any to be able to do for loop below
        keysValues = Object.values(order)[1];
        assert(Array.isArray(keysValues));
        for (let value of keysValues) {
            if (!columns.includes(value)) {
                return "'keys' values in ORDER must be in COLUMNS, but " + value + "is not in COLUMNS";
            }
        }
        return true;
    }

    // ================================== ESTABLISH DATASET ============================== //
    /**
     * Sets dataset to use
     * Looks in the datasets array, and if the dataset implied by columns is found, sets that as the dataset
     * ex. datasets: [courses, AAN, ...] | Query: {"COLUMNS": ["courses_avg"]} | key = courses | exists in datasets
     */
    public queryEstablishDataset(query: any, datasets: Dataset[]): any {
        let datasetID = "";
        // If no TRANSFORMATIONS, set according to first key in COLUMNS
        if (Object.keys(query).length === 2) {
            let firstKeyInColumns = query["OPTIONS"]["COLUMNS"][0]; // courses_avg
            datasetID = firstKeyInColumns.substring( 0, firstKeyInColumns.indexOf("_")); // courses, rooms
        }
        // If yes TRANSFORMATIONS, set according to first key in GROUP
        if (Object.keys(query).length === 3) {
            let firstKeyInGroup = query["TRANSFORMATIONS"]["GROUP"][0]; // courses_avg
            datasetID = firstKeyInGroup.substring( 0, firstKeyInGroup.indexOf("_")); // courses, rooms
        }
        for (let dataset of datasets) {
            if (dataset["id"] === datasetID) {
                PQGeneralHelpers.dataSetID = datasetID;
                PQGeneralHelpers.dataSetKind = dataset["kind"];
                return dataset;
            }
        }
        // Reach this point if no matching dataset is found
        this.errorMessage = "Dataset not found";
        return this.errorMessage;
    }
}
