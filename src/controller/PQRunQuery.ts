import Dataset from "./dataset/Dataset";
import PQPreQSyntax from "./PQPreQSyntax";
import PQFilter from "./PQFilter";
import Log from "../Util";
import PQTransformer from "./PQTransformer";
import PQGeneralHelpers from "./PQGeneralHelpers";

export default class PQRunQuery extends PQPreQSyntax {
    private allSectionsInDataset: any[];
    private transformer: any;

    constructor() {
        super();
        this.allSectionsInDataset = [];
        this.transformer = new PQTransformer();
    }

    // ================== RUN QUERY ================== //
    public runQuery(query: any, datasetToUse: Dataset): any {
        this.allSectionsInDataset = this.populateAllSections(datasetToUse);
        // Log.trace("Finished populating all sections");

        let queryResults: any;

        // ================== FILTER CHECK ================== //
        // Step 1: Guard for Object.keys
        if (query["WHERE"] === undefined || query["WHERE"] === null) {
            return "Object.keys will call on undefined or null WHERE";
        }
        // Step 2a: NO FILTER, pass all sections as query result
        if (Object.keys(query["WHERE"]).length === 0) {
            Log.trace("No WHERE detected, returning all sections...");
            queryResults = this.allSectionsInDataset;
        } else {
            // Step 2b: YES FILTER
            Log.trace("WHERE detected, doing filter...");
            queryResults = new PQFilter(
                this.allSectionsInDataset
            ).doFilter(query["WHERE"], 0);
            if (typeof queryResults === "string") {
                this.errorMessage = queryResults;
                return this.errorMessage;
            }
        }
        // ====================== TRIM ====================== //
        let trimResult: any;
        // returns list of sections w/o junk keys (courses_tier)
        trimResult = this.doTrim(queryResults, query);
        if (typeof trimResult === "string") {
            this.errorMessage = trimResult;
            return this.errorMessage;
        }
        this.filteredResults = trimResult;
        // ====================== TRANSFORMATIONS ====================== //
        // If transformation exists...
        if (Object.keys(query).length === 3) {
            let transformResult = this.processTransformation(trimResult, query);
            if (typeof transformResult === "string") {
                this.errorMessage = transformResult;
                return this.errorMessage;
            }
            this.filteredResults = transformResult;
        }
        // ================== LENGTH CHECK ================== //
        if (this.filteredResults.length > 5000) {
            return "Too large"; //  InsightFacade performQuery must receive this exact message
        }
        // ====================== ORDER ====================== //
        if (query["OPTIONS"] === undefined || query["OPTIONS"] === null) {
            return "Object.keys will call on undefined or null in doTrim";
        }
        if (Object.keys(query["OPTIONS"]).length === 2) {
            this.filteredResults = this.doOrder(this.filteredResults, query);
        }

        return this.filteredResults;
    }

    // ====================== HELPER FUNCTIONS ====================== //

    /** Populates a list with all sections in the dataset */
    private populateAllSections(dataset: Dataset) {
        let allItemsHolder = [];
        let numOfData = dataset["data"].length; // so number of courses or number of rooms
        for (let i = 0; i < numOfData; i++) {
            let currData = dataset["data"][i];

            if (dataset["kind"] === "courses") {
                let numSections = currData["result"].length; // number of sections in courses
                for (let j = 0; j < numSections; j++) {
                    let currItem = dataset["data"][i].result[j];
                    allItemsHolder.push(currItem);
                }
            } else if (dataset["kind"] === "rooms") {
                allItemsHolder.push(currData);
            }
        }
        return allItemsHolder;
    }

    /**
     * Trims each section according to what's in columns
     * @param filteredList: will be a list of sections, not a list of a list of sections
     * @param query: so we can access the keys in COLUMNS
     */
    private doTrim(filteredList: any[], query: any): any {
        let trimmedList = [];

        for (let section of filteredList) {
            let listOfKeysAlreadyAdded = [];
            let trimmedSection = {};
            let numOfColumns = query["OPTIONS"]["COLUMNS"].length;
            for (let i = 0; i < numOfColumns; i++) {
                let keyToSelectFor = query["OPTIONS"]["COLUMNS"][i]; // ex. keyToSelectFor = courses_avg
                if (keyToSelectFor.indexOf("_") !== -1) {
                    // Object construction
                    let key = PQGeneralHelpers.translate(keyToSelectFor); // ex. key = "Avg"
                    let value = section[key]; // ex. 97.7
                    let object = {[keyToSelectFor]: value}; // ex. {courses_avg: 97}

                    // ex. first run: section: {{courses_avg: 97}}
                    // ex. second run: section: {{courses_avg: 97}, {courses_dept: "aanb"}}
                    Object.assign(trimmedSection, object);
                    listOfKeysAlreadyAdded.push(keyToSelectFor);
                }
            }
            // If there's TRANSFORMATIONS, add the key in APPLY and GROUP if it's not already added
            if (Object.keys(query).length === 3) {
                // Add the key in APPLY
                let apply = query["TRANSFORMATIONS"]["APPLY"];
                let numOfApplyGrandchildren = apply.length;
                for (let j = 0; j < numOfApplyGrandchildren; j++) {
                    let grandchild = Object.values(apply[j])[0];
                    let grandchildValue: any = Object.values(grandchild)[0]; // "courses_avg"
                    if (!listOfKeysAlreadyAdded.includes(grandchildValue)) {
                        let key = PQGeneralHelpers.translate(grandchildValue); // "courses_avg" -> "Avg"
                        let value = section[key];
                        let object = {[grandchildValue]: value};

                        Object.assign(trimmedSection, object);
                        listOfKeysAlreadyAdded.push(grandchildValue);
                    }
                }

                // Add the key in GROUP
                let group = query["TRANSFORMATIONS"]["GROUP"];
                let numOfGroupChildren = group.length;
                for (let k = 0; k < numOfGroupChildren; k++) {
                    let groupChild: any = group[k]; // "courses_avg"
                    // Log.trace("groupChild: " + groupChild);
                    if (!listOfKeysAlreadyAdded.includes(groupChild)) {
                        let key = PQGeneralHelpers.translate(groupChild);
                        let value = section[key];
                        let object = {[groupChild]: value};

                        Object.assign(trimmedSection, object);
                        listOfKeysAlreadyAdded.push(groupChild);
                    }
                }
            }
            trimmedList.push(trimmedSection); // ex. trimmedList = [{trimmedS1}, {trimmedS2}, {trimmedS3}]
        }

        return trimmedList;
    }

    /** Order the list of sections according to ORDER key */
    public doOrder(unsortedListOfSections: any, query: any): any[] {
        let order = query["OPTIONS"]["ORDER"];

        // If there's only one key in ORDER ex. "ORDER": "courses_avg"
        if (typeof order === "string") {
            return this.doAscending(unsortedListOfSections, order);
        }

        // If there are two order keys, then first look at UP/DOWN, then sort by keys
        if (Object.keys(order).length === 2) {
            if (order["dir"] === "UP") {
                return this.doAscending(unsortedListOfSections, order);
            } else if (order["dir"] === "DOWN") {
                return this.doDescending(unsortedListOfSections, order);
            }
        }
    }

    /**
     * orderKeys is ex. [courses_avg, courses_dept]
     * order is query["OPTIONS"]["ORDER"];
     */
    public doAscending(unsortedList: any, order: any): any {
        let sortedList: any[];
        let self = this;

        if (typeof order === "string") {
            // -1 = a goes first || 1 = b goes first || 0 = tie, don't change order
            sortedList = unsortedList.sort(function (a: any, b: any) {
                // Remember that the unsorted list has sections with courses_avg, not Avg
                // let translatedKey = self.translate(order); // translates courses_avg to AVG
                if (a[order] > b[order]) {
                    return 1;
                } else if (a[order] < b[order]) {
                    return -1;
                } else {
                    return 0;
                }
            });
            return sortedList;
        }
        // Log.trace("Order is..." + order);
        let orderKeys = order["keys"];
        // Log.trace("Order keys is order['keys'] is... " + orderKeys);
        sortedList = unsortedList.sort(function (a: any, b: any) {
            // let translatedKey = self.translate(orderKeys[0]);
            if (a[orderKeys[0]] > b[orderKeys[0]]) { // if a greater than b , put behind b
                return 1;
            } else if (a[orderKeys[0]] < b[orderKeys[0]]) {
                return -1;
            } else {
                return self.ascendingTieBreaker(a, b, orderKeys);
            }
        });
        return sortedList;
    }

    public ascendingTieBreaker(a: any, b: any, orderKeys: any[]): number {
        for (let i = 1; i < orderKeys.length; i++) {
            // let translatedKey = this.translate(orderKeys[i]);
            if (a[orderKeys[i]] > b[orderKeys[i]]) {
                return 1;
            } else if (a[orderKeys[i]] < b[orderKeys[i]]) {
                return -1;
            }
        }
        // nothing else to order by
        return 0;
    }

    public doDescending(unsortedList: any, order: any): any {
        let sortedList: any[];
        let orderKeys = order["keys"]; // ex. courses_avg
        let self = this;

        sortedList = unsortedList.sort(function (a: any, b: any) {
            // -1 = a goes first || 1 = b goes first || 0 = tie, don't change order
            // let translatedKey = self.translate(orderKeys[0]);
            // Log.trace(orderKeys);
            if (a[orderKeys[0]] < b[orderKeys[0]]) {
                return 1;
            } else if (a[orderKeys[0]] > b[orderKeys[0]]) {
                return -1;
            } else {
                return self.descendingTieBreaker(a, b, orderKeys);
            }
        });
        return sortedList;
    }

    public descendingTieBreaker(a: any, b: any, orderKeys: any[]): number {
        for (let i = 1; i < orderKeys.length; i++) {
            if (a[orderKeys[i]] < b[orderKeys[i]]) {
                return 1;
            } else if (a[orderKeys[i]] > b[orderKeys[i]]) {
                return -1;
            }
        }
        // nothing else to order by
        return 0;
    }

    public processTransformation(filteredResults: any, query: any) {
        // if no transformations, return filtered results
        if (Object.keys(query).length === 2) {
            return this.filteredResults;
        }
        if (Object.keys(query).length === 3) {
            let resultTransformation: any;
            resultTransformation = this.transformer.doTransformation(this.filteredResults, query);
            if (typeof resultTransformation !== "object") {
                this.errorMessage = "An error occurred in doTransformation";
                return this.errorMessage;
            }
            return resultTransformation;
        }
    }

}
