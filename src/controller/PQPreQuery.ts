import Dataset from "./dataset/Dataset";
import Log from "../Util";

export default class PQPreQuery {
    public errorMessage: string;
    public dataSetID: string;
    public filteredResults: any[];
    public listOfAcceptableFields: string[];

    constructor() {
        this.errorMessage = "";
        this.dataSetID = "courses"; // "courses" by default
        this.filteredResults = [];
        this.listOfAcceptableFields = [
            "dept",
            "id",
            "avg",
            "instructor",
            "title",
            "pass",
            "fail",
            "audit",
            "uuid",
            "year",
        ];
    }

    // ================================== SYNTAX CHECKS ================================== //

    /**
     * Checks syntax requirements
     * Input: query: {WHERE: ..., OPTIONS: ...}
     * Output: string with error message if error
     */
    public isInputQueryValid(query: any): any {
        // Step 1: Query should not be null or undefined
        if (typeof query === null) {
            this.errorMessage = "Query was found to be null or 'undefined'";
            return this.errorMessage;
        }

        // Step 2: Query has two keys: WHERE and OPTIONS
        if (
            !(
                Object.keys(query)[0] === "WHERE" &&
                Object.keys(query)[1] === "OPTIONS"
            )
        ) {
            this.errorMessage =
                "Query can only have two keys: WHERE and OPTIONS";
            return this.errorMessage;
        }

        // Step 3: Check WHERE and OPTIONS grammar
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
        if (query["WHERE"] === null) {
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
            this.errorMessage = "ERROR: First key in OPTIONS is not COLUMNS";
            return false;
        }

        // Step 4: COLUMNS must not be null / undefined / empty
        let columns = query["OPTIONS"]["COLUMNS"];
        if (
            columns === null ||
            columns === undefined ||
            Object.keys(columns).length === 0
        ) {
            return false;
        }

        // Step 5: If ORDER exists, it must be valid
        if (Object.keys(options).length === 2) {
            return this.isOrderValid(query);
        }

        // Step 6: Reaching this point means there is no ORDER and query is valid
        return true;
    }

    /**
     *  Checks ORDER grammar
     *  Conditions: ORDER must have exactly one child key
     *  Conditions: Child key must be one of the column's child keys
     */
    private isOrderValid(query: any): boolean {
        let order = query["OPTIONS"]["ORDER"];

        // Step 1: ORDER key must be called "ORDER"
        // Note: options has already been checked for null/undefined upstream
        if (Object.keys(query["OPTIONS"])[1] !== "ORDER") {
            this.errorMessage = "ERROR: Second key in OPTIONS must be ORDER";
            return false;
        }

        // Step 2: ORDER key must be a string
        //      VALID:      ex. "ORDER": "courses_avg"
        //      INVALID:    ex. "ORDER": ["courses_avg"]
        if (typeof order !== "string") {
            this.errorMessage = "ERROR: ORDER must be a single string";
            return false;
        }

        // Step 3: ORDER key is in COLUMNS
        //      VALID:      ex. {"COLUMNS": ["courses_avg", "courses_dept"], "ORDER": "courses_avg"}
        //      INVALID:    ex. {"COLUMNS": ["courses_avg", "courses_dept"], "ORDER": "courses_id"}
        let orderValue = order; // ex. "courses_avg"
        let columns = query["OPTIONS"]["COLUMNS"]; // ex. ["courses_avg", "courses_dept", ...]
        if (!columns.includes(orderValue)) {
            this.errorMessage =
                "ORDER key: " + orderValue + " must be in COLUMNS";
            return false;
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
        let firstKeyInColumns = query["OPTIONS"]["COLUMNS"][0]; // courses_avg
        let datasetID = firstKeyInColumns.substring(
            0,
            firstKeyInColumns.indexOf("_"),
        ); // courses
        for (let dataset of datasets) {
            if (dataset["id"] === datasetID) {
                this.dataSetID = datasetID;
                return dataset;
            }
        }
        // Reach this point if no matching dataset is found
        this.errorMessage = "Dataset not found";
        return this.errorMessage;
    }

    // ================================== SEMANTIC CHECKS ============================== //
    /**
     * Checks semantic requirements in COLUMN and ORDER
     */
    public inputOptionsKeysAreValid(query: any, datasetToUse: Dataset): any {
        // Step 1: First key in COLUMNS is the dataset we're using
        if (!this.isKeyLoaded(query, datasetToUse)) {
            this.errorMessage =
                "Referenced dataset " +
                "'" +
                datasetToUse["id"] +
                "'" +
                " not added yet";
            return this.errorMessage;
        }

        // Step 2: Check if COLUMNS and ORDER keyIDs match the dataset ID (ex. "courses")
        if (!this.areColumnAndOrderKeysValid(query)) {
            this.errorMessage = "Invalid key in COLUMNS or ORDER";
            return this.errorMessage;
        }

        Log.trace("Pre-Query semantic checks passed");
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
    private areColumnAndOrderKeysValid(query: any): boolean {
        // Step 1: Check COLUMNS id_field
        for (let key of query["OPTIONS"]["COLUMNS"]) {
            // ex. courses_avg

            // Step 1a: Check ID of id_field
            let keyID = key.substring(0, key.indexOf("_")); // ex. courses_avg -> courses
            if (keyID !== this.dataSetID) {
                return false;
            }

            // Step 1b: Check field of id_field
            let field = key.substring(key.indexOf("_") + 1, key.length); // ex. courses_avg -> avg
            if (!this.listOfAcceptableFields.includes(field)) {
                return false;
            }
        }

        // Step 2: Check ORDER id_field
        // Step 2a: COLUMNS is not undefined / null
        if (query["OPTIONS"] === undefined || query["OPTIONS"] === null) {
            return false;
        }

        // Step 2b: Check ID of id_field
        if (Object.keys(query["OPTIONS"]).length === 2) {
            let orderKey = query["OPTIONS"]["ORDER"]; // ex. courses_avg
            let orderID = orderKey.substring(0, orderKey.indexOf("_")); // courses_avg -> courses
            if (orderID !== this.dataSetID) {
                return false;
            }

            // Step 1b: Check field of id_field
            let orderField = orderKey.substring(
                orderKey.indexOf("_") + 1,
                orderKey.length,
            ); // ex. courses_avg -> avg
            if (!this.listOfAcceptableFields.includes(orderField)) {
                return false;
            }
        }
        // TODO: delete this if sure it's redundant
        // Passed all checks
        return true;
    }
}
