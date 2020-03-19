import Dataset from "../dataset/Dataset";
import Log from "../../Util";
import * as assert from "assert";
import PQGeneralHelpers from "./PQGeneralHelpers";
import PQPreQTransfChecker from "./PQPreQTransfChecker";

export default class PQPreQSyntax {
    public errorMessage:        string;
    public filteredResults:     any[];
    public helpers:             PQGeneralHelpers;
    private transformation:     PQPreQTransfChecker;

    constructor() {
        this.errorMessage       = "";
        this.filteredResults    = [];
        this.helpers            = new PQGeneralHelpers();
        this.transformation     = new PQPreQTransfChecker();
    }

    public isInputQueryValid(query: any): any {
        // CHECK: Query should not be null or undefined
        if (query === null || query === undefined) {
            this.errorMessage = "Query was found to be null or 'undefined'";
            return this.errorMessage;
        }

        // CHECK: Query must have 2 or 3 keys
        let qLength = Object.keys(query).length;
        if (!(qLength === 2 || qLength === 3)) {
            this.errorMessage = "Query must have 2 or 3 keys. Currently has: " + qLength;
            return this.errorMessage;
        }

        // CHECK: Query has WHERE and OPTIONS (and TRANSFORMATIONS). They do NOT have to be in order.
        Log.trace("Length of query " + qLength);
        if (qLength === 2) {
            if (!(Object.keys(query).includes("WHERE") && Object.keys(query).includes("OPTIONS"))) {
                this.errorMessage = "Query has " + qLength + " keys. They must be WHERE and OPTIONS";
                return this.errorMessage;
            }
        }
        if (qLength === 3) {
            if (!(Object.keys(query).includes("WHERE")   &&
                  Object.keys(query).includes("OPTIONS") &&
                  Object.keys(query).includes("TRANSFORMATIONS"))) {
                this.errorMessage = "There are three keys. They must be WHERE, OPTIONS, and TRANSFORMATIONS";
                return this.errorMessage;
            }
            // CHECK: If there is a TRANSFORMATIONS key, check its grammar
            let isTransformationValidResult = this.transformation.isTransformationsValid(query);
            if (typeof isTransformationValidResult === "string") {
                this.errorMessage = isTransformationValidResult;
                return this.errorMessage;
            }
        }

        // CHECK: WHERE and OPTIONS grammar are valid
        if (!(this.isWhereValid(query) && this.isOptionsValid(query))) {
            return this.errorMessage;
        }

        Log.trace("Input query is valid");
        return true;
    }

    /**
     * Checks WHERE grammar
     * Condition 1: WHERE must have 0 or 1 value that is an object
     *      Valid ex. {"WHERE": {"AND": ...}}
     *      Valid ex. {"WHERE": {}}
     */
    public isWhereValid(query: any): boolean {
        if (query["WHERE"] === null || Array.isArray(query["WHERE"])) {
            return false;
        }
        return Object.keys(query["WHERE"]).length <= 1;
    }

    /**
     * Checks OPTIONS grammar
     * Condition 1: OPTIONS must have one or two values
     * Condition 2: OPTIONS must include COLUMNS. ORDER is optional.
     */
    public isOptionsValid(query: any): boolean {
        let options = query["OPTIONS"];
        let columns = query["OPTIONS"]["COLUMNS"];

        // CHECK: COLUMNS and OPTIONS must not be null/undefined
        if (columns === null || columns === undefined || options === undefined || options === null) {
            this.errorMessage = "ERROR: COLUMNS and/or ORDER must not be null / undefined";
            return false;
        }

        let optionKeys = Object.keys(options);
        let columnKeys = Object.keys(columns);

        // CHECK: COLUMNS is not empty
        if (columnKeys.length === 0) {
            this.errorMessage = "ERROR: COLUMNS cannot be empty!";
            return false;
        }

        // CHECK: OPTIONS has one or two values
        if (!(optionKeys.length === 1 || optionKeys.length === 2)) {
            this.errorMessage = "ERROR: OPTIONS must have one or two keys";
            return false;
        }

        // CHECK: OPTIONS must include COLUMNS
        if (!optionKeys.includes("COLUMNS")) {
            this.errorMessage = "ERROR: OPTIONS must include COLUMNS";
            return false;
        }

        // CHECK: If ORDER exists, it must be called ORDER and must be valid;
        if (optionKeys.length === 2) {
            if (!optionKeys.includes("ORDER")) {
                this.errorMessage = "ERROR: Cannot find 'ORDER'";
                return false;
            }
            let isOrderValidResult = this.isOrderValid(query);
            if (typeof this.isOrderValid(query) === "string") {
                this.errorMessage = isOrderValidResult;
                return false;
            }
        }

        return true;
    }

    /**
     *  Checks ORDER grammar
     *  Condition 1: ORDER must have at least one key
     *  Condition 2: ORDER can be in C1 or C2 format
     *  Condition 3: If C1 format, ORDER can only have one key that is a string
     *  Condition 4: IF C2 format, ORDER must have 2 keys: 'dir' and 'keys'
     */
    public isOrderValid(query: any): any {
        let columns = query["OPTIONS"]["COLUMNS"];
        let order   = query["OPTIONS"]["ORDER"];

        // CHECK: If ORDER key is a string...
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

        // CHECK: If ORDER key is an object that's not a list
        // ex. ORDER: {dir: "DOW", keys: ["courses_avg"]}
        if (!(typeof order === "object" && !Array.isArray(order))) {
            return "ORDER must be a non-array object";
        }

        // CHECK: There must be exactly two keys
        if (Object.keys(order).length !== 2) {
            return "Order key is not just a string, so it must have two keys";
        }

        // CHECK: The two keys must be "dir" and "keys"
        if (!(Object.keys(order).includes("dir") && Object.keys(order).includes("keys"))) {
            return "Order key must have dir and keys";
        }

        // CHECK: dir must be UP or DOWN
        // let dirValue = Object.values(order)[0];
        let dirValue = order["dir"];
        if (!(dirValue === "UP" || dirValue === "DOWN")) {
            return "dir must be UP or DOWN, instead got... " + dirValue;
        }

        // CHECK: "keys" must a non-empty array
        if (!Array.isArray(order["keys"])) {
            return "'keys' key in ORDER must be an array";
        }
        if (order["keys"].length < 1) {
            return "'keys' key in ORDER must not be empty";
        }

        // CHECK: values in "keys" must be in COLUMNS
        let keysValues: any; // Must explicitly state keysValue is of type any to be able to do for loop below
        keysValues = Object.values(order["keys"]);
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
