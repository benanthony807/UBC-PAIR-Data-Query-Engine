import Dataset from "./Dataset";
import Log from "../Util";
import * as assert from "assert";
import PQGeneralHelpers from "./PQGeneralHelpers";

export default class PQPreQuery {
    public errorMessage: string;
    public dataSetID: string;
    public filteredResults: any[];
    private helpers: PQGeneralHelpers;

    constructor() {
        this.errorMessage = "";
        this.dataSetID = "courses"; // "courses" by default
        this.filteredResults = [];
        this.helpers = new PQGeneralHelpers();
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

        // Step 2: Query has two or three keys: WHERE and OPTIONS (and TRANSFORMATIONS)
        Log.trace("Length of query " + Object.keys(query).length);
        if (Object.keys(query).length === 2) {
            if (!(Object.keys(query)[0] === "WHERE" && Object.keys(query)[1] === "OPTIONS")) {
                this.errorMessage = "Query has " + Object.keys(query).length + " keys. They must be WHERE and OPTIONS";
                return this.errorMessage;
            }
        }
        if (Object.keys(query).length === 3) {
            if (!(Object.keys(query)[0] === "WHERE" &&
                Object.keys(query)[1] === "OPTIONS" &&
                Object.keys(query)[2] === "TRANSFORMATIONS")) {
                this.errorMessage = "Query has " + Object.keys(query).length + " keys. " +
                    "There must be Three keys: WHERE, OPTIONS, and TRANSFORMATIONS";
                return this.errorMessage;
            }
            // Step 3: If there is a TRANSFORMATIONS key, check its grammar
            if (!(this.isTransformationsvalid(query))) {
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
            let isOrderValidResult = this.isOrderValid(query);
            if (typeof isOrderValidResult === "string") {
                this.errorMessage = isOrderValidResult;
                return false;
            }
        }

        // Step 6: Reaching this point means there is no ORDER and query is valid
        return true;
    }

    /**
     *  Checks ORDER grammar
     *  Conditions: ORDER must have exactly one child key
     *  Conditions: Child key must be one of the column's child keys
     */
    public isOrderValid(query: any): boolean {
        let order = query["OPTIONS"]["ORDER"];
        let columns = query["OPTIONS"]["COLUMNS"]; // ex. ["courses_avg", "courses_dept", ...]

        // Step 1: ORDER key must be called "ORDER"
        // Note: options has already been checked for null/undefined upstream
        if (Object.keys(query["OPTIONS"])[1] !== "ORDER") {
            this.errorMessage = "ERROR: Second key in OPTIONS must be ORDER";
            return false;
        }

        // Step 2: If ORDER key is a string...
        //      VALID:      ex. "ORDER": "courses_avg"
        //      INVALID:    ex. "ORDER": ["courses_avg"]
        if (typeof order === "string") {
            // ORDER key is in COLUMNS
            //      VALID:      ex. {"COLUMNS": ["courses_avg", "courses_dept"], "ORDER": "courses_avg"}
            //      INVALID:    ex. {"COLUMNS": ["courses_avg", "courses_dept"], "ORDER": "courses_id"}
            let orderValue = order; // ex. "courses_avg"
            if (!columns.includes(orderValue)) {
                this.errorMessage = "ORDER key: " + orderValue + " must be in COLUMNS";
                return false;
            }
            return true;
        }

        // Step 2: If ORDER key is an object that's not a list
        // ex. ORDER: {dir: "DOW", keys: ["courses_avg"]}
        if (!(typeof order === "object" && !Array.isArray(order))) {
            this.errorMessage = "ORDER must be a non-array object";
            return false;
        }

        // Step 3: There must be two keys
        if (Object.keys(order).length !== 2) {
            this.errorMessage = "Order key is not just a string, so it must have two keys";
            return false;
        }

        // Step 4: The first key must be dir, the second key must be keys
        let firstKey = Object.keys(order)[0];
        let secondKey = Object.keys(order)[1];
        if (firstKey !== "dir" && secondKey !== "keys") {
            this.errorMessage = "first key must be dir, second key must be keys";
            return false;
        }

        // Step 5: dir must be UP or DOWN
        let dirValue = Object.values(order)[0];
        if (!(dirValue === "UP" || dirValue === "DOWN")) {
            this.errorMessage = "dir must be UP or DOWN, instead got... " + dirValue;
            return false;
        }

        // Step 6: "keys" must a non-empty array
        if (!Array.isArray(order["keys"])) {
            this.errorMessage = "'keys' key in ORDER must be an array";
            return false;
        }
        if (order["keys"].length < 1) {
            this.errorMessage = "'keys' key in ORDER must not be empty";
            return false;
        }

        // Step 7: values in "keys" must be in COLUMNS
        let keysValues: any; // Must explicitly state keysValue is of type any to be able to do for loop below
        keysValues = Object.values(order)[1];
        assert(Array.isArray(keysValues));
        for (let value of keysValues) {
            if (!columns.includes(value)) {
                this.errorMessage = "'keys' values in ORDER must be in COLUMNS, but " + value + "is not in COLUMNS";
                return false;
            }
        }
        return true;
    }

    public isTransformationsvalid(query: any) {
        let transformations = query["TRANSFORMATIONS"];
        // Step 1: TRANSFORMATIONS must have 2 keys
        if (Object.keys(transformations).length !== 2) {
            this.errorMessage = "TRANSFORMATIONS must have 2 keys";
            return false;
        }
        // Step 2: The two keys of TRANSFORMATIONS are GROUP and APPLY
        if (!(Object.keys(transformations)[0] === "GROUP" && Object.keys(transformations)[1] === "APPLY")) {
            this.errorMessage = "The two keys of TRANSFORMATIONS must be GROUP and APPLY";
            return false;
        }

        // Step 3: Check Group and Apply
        // Error message is set in below methods
        if (!(this.isGroupValid(query) && this.isApplyValid(query))) {
            return false;
        }

        // Passed all tests
        return true;
    }

    /** Note: order of steps is important  */
    public isGroupValid(query: any): boolean {
        let group = query["TRANSFORMATIONS"]["GROUP"];
        // Step 1: GROUP is an array
        if (!Array.isArray(group)) {
            this.errorMessage = ("GROUP must be an array");
            return false;
        }
        // Step 2: GROUP has at least 1 item in it
        if (!(group.length >= 1)) {
            this.errorMessage = ("GROUP must have at least 1 item in it");
            return false;
        }
        // Step 3: GROUP has every valid id_field in COLUMNS (GROUP can have extra)
        // ex. "COLUMNS":   [ "courses_dept", "courses_title", "overallAvg" ]
        //     "GROUP":     [ "courses_dept", "courses_title" ] is okay
        //     "GROUP":     [ "courses_dept", "courses_title", "courses_avg" ] is okay
        //     "GROUP":     [ "courses_dept", "courses_title", "courses_title" ] is okay
        //     "GROUP":     [ "courses_dept" ] is NOT okay
        let listOfValidUnderscoreItemsPreFlat: any = [];
        let listOfValidUnderscoreItems: any;
        let listOfUnderscoreGroupItems: any = Object.values(group);
        for (let key of query["OPTIONS"]["COLUMNS"]) {
            if (this.keyIsValidColumnUnderscoreItem(key)) {
                listOfValidUnderscoreItemsPreFlat.push(key);
            }
        }
        listOfValidUnderscoreItems = listOfValidUnderscoreItemsPreFlat.flat();
        if (!(listOfValidUnderscoreItems.every((val: any) => listOfUnderscoreGroupItems.includes(val)))) {
            this.errorMessage = ("id_field items in COLUMNS must be included in GROUP");
            return false;
        }

        for (let item of group) { // "courses_title"
            // Step 4: GROUP has valid keys
            let field = item.substring(item.indexOf("_") + 1); // "title"
            if (!(this.helpers.listOfAcceptableFields.includes(field))) {
                this.errorMessage = "Error in GROUP: Must be a valid field";
                return false;
            }

            // Step 5: GROUP does not reference multiple datasets
            let id = item.substring(0, item.indexOf("_")); // "courses"
            if (id !== this.dataSetID) {
                this.errorMessage = "Error in GROUP: Cannot query more than one dataset";
                return false;
            }
        }
        return true;
    }

    public isApplyValid(query: any): boolean {
        let apply = query["TRANSFORMATIONS"]["APPLY"];
        // Step 1: APPLY is a list
        if (!Array.isArray(apply)) {
            this.errorMessage = "APPLY must be an array";
            return false;
        }
        // Step 2: APPLY has at least 1 item in it
        if (!(apply.length >= 1)) {
            this.errorMessage = "APPLY must have at least 1 item in it";
            return false;
        }

        // Set up list of ApplyKeys ex. ["overallAvg", "hello"]
        let listOfApplyKeysPreFlat: any = [];
        let listOfApplyKeys: any = [];
        let numOfApplyKeys = Object.values(apply).length;
        // For each ApplyKey ex. "overallAvg"
        for (let i = 0; i < numOfApplyKeys; i++) {
            listOfApplyKeysPreFlat.push(Object.keys(Object.values(apply)[i]));
            let applyChild: any = Object.values(apply)[i]; // {"overallAvg" { "AVG": "courses_avg" } }
            let applyGrandchild: any = Object.values(applyChild)[0]; // { "AVG": "courses_avg" }

            if (!this.isGrandchildrenValid(applyGrandchild)) {
                return false; // error message already set in above method
            }
        }
        listOfApplyKeys = listOfApplyKeysPreFlat.flat();
        // Step 10: APPLY keys do not have an _
        for (let key of listOfApplyKeys) {
            if (!(key.indexOf("_") === -1)) {
                this.errorMessage = "Cannot have underscore in applyKey";
                return false;
            }
        }
        // Step 11: NO duplicate APPLY keys
        if (this.hasDuplicates(listOfApplyKeys)) {
            this.errorMessage = "Cannot have duplicate keys in APPLY";
            return false;
        }
        return true;
    }

    private isGrandchildrenValid(applyGrandchild: any): boolean {
        // Step 3 APPLY's grandchild should be an object
        if (!(typeof applyGrandchild === "object" && !Array.isArray(applyGrandchild))) {
            this.errorMessage = "APPLY grandchild should be an object";
            return false;
        }

        // Step 4: APPLY's grandchild cannot be an empty object
        if (Object.keys(applyGrandchild).length === 0) {
            this.errorMessage = "APPLY's grandchild should not be an empty object";
            return false;
        }

        // Step 5: APPLY's grandchild key should be one of  "AVG" / "MAX" / "MIN" / "COUNT" / "SUM"
        let applyGrandchildKey = Object.keys(applyGrandchild)[0]; // {"AVG": "courses_avg"} -> "AVG"
        if (!(applyGrandchildKey === "AVG" ||
            applyGrandchildKey === "MAX" ||
            applyGrandchildKey === "MIN" ||
            applyGrandchildKey === "SUM" ||
            applyGrandchildKey === "COUNT")) {
            this.errorMessage = "APPLY grandchild key should be one of AVG / MAX / MIN / COUNT / SUM";
            return false;
        }

        // Step 6: APPLY'S grandchild field exists
        // ex. { "overallAvg": { "AVG": "courses_avg" } } -> avg must exist
        let applyGrandchildValue: any = Object.values(applyGrandchild)[0]; // "courses_avg"
        let field = applyGrandchildValue.substring(applyGrandchildValue.indexOf("_") + 1); // "avg"
        if (!(this.helpers.listOfAcceptableFields.includes(field))) {
            this.errorMessage = "Must be a valid id_field";
            return false;
        }

        // Step 7: APPLY's grandchild value should have a typeof number for MAX/MIN/AVG/SUM
        if (applyGrandchildKey !== "COUNT")  { // applyGrandchildKey will be one of AVG MAX MIN SUM
            if (!(this.helpers.acceptableNumberFields.includes(field))) {
                this.errorMessage = "APPLY key is " + applyGrandchildKey + ", so type of field must be a number";
                return false;
            }
        }

        // Step 8: APPLY's grandchild id should not reference multiple datasets
        let id = applyGrandchildValue.substring(0, applyGrandchildValue.indexOf("_")); // "courses"
        if (id !== this.dataSetID) {
            this.errorMessage = "Error in APPLY: Cannot query more than one dataset";
            return false;
        }

        return true;
    }

    private hasDuplicates(list: any): boolean {
        let dupListCounts: any = [];
        for (let i = 0; i <= list.length; i++) {
            if (dupListCounts[list[i]] === undefined) {
                dupListCounts[list[i]] = 1;
            } else {
                return true;
            }
        }
        return false;
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
            this.errorMessage = "Referenced dataset " + "'" + datasetToUse["id"] + "'" + " not added yet";
            return this.errorMessage;
        }

        // Step 2: Check if COLUMNS and ORDER keyIDs match the dataset ID (ex. "courses")
        if (!this.areColumnAndOrderKeysValid(query)) {
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

        // Step 2: Check ORDER id_field
        return this.checkOrderSemantics(query);
    }

    private checkOrderSemantics(query: any): boolean {
            let order = query["OPTIONS"]["ORDER"]; // "courses_avg"
            if (typeof order === "string") {
                return this.areIDAndFieldValid(order);
            }
            if (order.length === 2) {
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
        if (orderID !== this.dataSetID) {
            return false;
        }

        let orderField = orderKey.substring( orderKey.indexOf("_") + 1, orderKey.length); // ex. courses_avg -> avg
        return this.helpers.listOfAcceptableFields.includes(orderField);

    }

    public checkColumnSemantics(query: any) {
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
                if (!this.keyIsValidColumnUnderscoreItem(key)) {
                    return false; // error message is already set in the function above
                }
            } else if (Object.keys(query).length === 3) {
                // Step 1: If no _, item must be in APPLY (APPLY won't have any _ in it).
                if (key.indexOf("_") === -1) {
                    if (listOfApplyItems.indexOf(key) === -1) {
                        this.errorMessage = "Column key does not have an underscore so must be in APPLY";
                        return false;
                    }
                } else if (key.indexOf("_") !== -1) {
                    if (!this.keyIsValidColumnUnderscoreItem(key)) {
                        return false; // error message is already set in the function above
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

    public keyIsValidColumnUnderscoreItem(key: any): boolean {
        // Step 1: key must have an _
        if ((key.indexOf("_")) === -1) {
            this.errorMessage = "Invalid key " + key + " in COLUMNS. Must have _";
            return false;
        }

        // Step 2: Check ID of id_field
        let keyID = key.substring(0, key.indexOf("_")); // ex. courses_avg -> courses
        if (keyID !== this.dataSetID) {
            this.errorMessage = "COLUMNS cannot reference multiple datasets or dataset not loaded yet";
            return false;
        }

        // Step 3: Check field of id_field
        let field = key.substring(key.indexOf("_") + 1, key.length); // ex. courses_avg -> avg
        if (!this.helpers.listOfAcceptableFields.includes(field)) {
            this.errorMessage = "COLUMNS has an invalid key ";
            return false;
        }

        return true;
    }
}
