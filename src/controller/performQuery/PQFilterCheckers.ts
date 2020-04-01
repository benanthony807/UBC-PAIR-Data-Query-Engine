import PQGeneralHelpers from "./PQGeneralHelpers";

export default class PQFilterCheckers {
    private helpers: PQGeneralHelpers;

    constructor() {
        this.helpers = new PQGeneralHelpers();
    }

    /** Runs multiple checks on leaves | @param currFilterType: One of GT LT EQ IS AND OR NOT */
    public leafCheck(query: any, currFilterType: string) {
        // Step 1: undefined / null check
        if (
            query[currFilterType] === undefined ||
            query[currFilterType] === null
        ) {
            return "object.Keys will be called on undefined / null in doFilter";
        }
        // Step 2: Leaf has one property
        let leafLength = Object.keys(query[currFilterType]).length;
        if (leafLength !== 1) {
            return currFilterType + " must have exactly one property";
        }
        // Step 3: Leaf does not refer to multiple datasets
        let currKey = Object.keys(query[currFilterType])[0]; // ex. courses_avg
        let currID = currKey.split("_")[0]; // isolates the id, ex. "courses"
        if (currID !== this.helpers.getDataSetID()) {
            return "Cannot query more than one dataset";
        }
        // Step 4: Leaf is an object, not an array
        if (
            typeof query[currFilterType] !== "object" ||
            Array.isArray(query[currFilterType])
        ) {
            return currFilterType + " must be an object";
        }
    }

    /** Runs grammar checks on branches */
    public branchGrammarCheck(query: any, currFilterType: string): any {
        if (currFilterType === "AND") {
            if (query["AND"].length === 0 || !Array.isArray(query["AND"])) {
                return "AND must be a non-empty array";
            } else {
                return true;
            }
        }

        if (currFilterType === "OR") {
            if (query["OR"].length === 0 || !Array.isArray(query["OR"])) {
                return "OR must be a non-empty array";
            } else {
                return true;
            }
        }

        // Must be NOT at this point
        if (query["NOT"] === undefined || query["NOT"] === null) {
            return "object.Keys will be called on undefined / null before doNot";
        }
        if (
            Object.keys(query["NOT"]).length !== 1 ||
            typeof query["NOT"] !== "object"
        ) {
            return "NOT must be a single object";
        }
        return true;
    }

    /**
     * Checks the FIELD in id_field: value
     * Condition: IS field must be string types: dept, instructor, etc
     * Condition: LT, GT, EQ field must be number types: year, avg, etc
     */
    public checkField(query: any, currFilterType: string): any {
        // Step 1: Guard for Object.keys
        if (
            query[currFilterType] === undefined ||
            query[currFilterType] === null
        ) {
            return "object.Keys null/undefined in checkField";
        }

        // Step 2: Set up variables
        let key = Object.keys(query[currFilterType])[0]; // ex. "courses_avg"
        let leafField = key.substring(key.indexOf("_") + 1); // ex. "avg"

        // Step 3: Compare fields depending on filter type
        if (currFilterType === "IS") {
            if (!PQGeneralHelpers.acceptableStringFields.includes(leafField)) {
                return (
                    "Invalid/Inappropriate key " + key + " in " + currFilterType
                );
            } else {
                return true;
            }
        }
        // GT LT EQ
        if (!PQGeneralHelpers.acceptableNumberFields.includes(leafField)) {
            return "Invalid/Inappropriate key " + key + " in " + currFilterType;
        }
        return true;
    }

    /** Checks the VALUE in id_field: value | IS field must be string | LT GT EQ field must be number */
    public checkValue(query: any, currFilterType: string) {
        let value = Object.values(query[currFilterType])[0];
        switch (currFilterType) {
            case "IS":
                if (typeof value !== "string") {
                    return (
                        "Invalid value type in " +
                        currFilterType +
                        ", should be string"
                    );
                } else {
                    return true;
                }

            case "LT":
            case "GT":
            case "EQ":
                if (typeof value !== "number") {
                    return (
                        "Invalid value type in " +
                        currFilterType +
                        ", should be number"
                    );
                }
        }
    }
}
