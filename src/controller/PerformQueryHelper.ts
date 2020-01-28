import {promises} from "dns";
import {resolve} from "dns";

export default class PerformQueryHelper {

    public errorMessage: string;


    constructor() {
        this.errorMessage = "";
    }
    // Helper functions

    // check if input query is valid.
    public inputQueryIsValid(query: any): boolean {

        // return true if the query has a body and OPTIONS
        if (this.hasBodyAndOptions(query)) {
            // return true if the query has valid OPTIONS grammar
            return this.hasValidOptionsGrammar(query);
        } else {
            return false;
        }
    }

        // inputQueryIsValid helper method
        // true if input query's first key is "WHERE" and second key is "OPTIONS"
        private hasBodyAndOptions(query: any): boolean {
            // Object.keys returns an array of the given object's property names.
            // keys takes the object as a parameter
            if (Object.keys(query)[0] !== "WHERE") {
                this.errorMessage = "Missing WHERE";
                return false;
            } else if (Object.keys(query)[1] !== "OPTIONS") {
                this.errorMessage = "Missing OPTIONS";
                return false;
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
        private hasValidOptionsGrammar(query: any) {
            // OPTIONS must have one or two keys
            if (Object.keys(query["OPTIONS"]).length === 1 || Object.keys(query["OPTIONS"]).length === 2) {
                // The first key should be "COLUMNS"
                if (Object.keys(query["OPTIONS"])[0] === "COLUMNS") {
                    // Columns must not be empty
                    if (Object.keys(query["OPTIONS"]).length === 0) {
                        this.errorMessage = "COLUMNS must be a non-empty array";
                        return false;
                    } else {
                        // if there is a second key
                        if (Object.keys(query["OPTIONS"]).length === 2) {
                            // if the second key is a valid ORDER, return true
                            return this.orderIsValid(query);
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
            private orderIsValid(query: any) {


                // the order key must be called "ORDER"
                if (Object.keys(query["OPTIONS"])[1] === "ORDER") {

                    let order = Object.keys(query["OPTIONS"])[1]; // sets order to be the second key in OPTIONS (ORDER)

                    // the order key must have exactly one field
                    if (order.length === 1) {

                        let orderField = order[0];
                        let columns = query["OPTIONS"]["COLUMNS"]; // sets columns to be the list of fields in "COLUMNS"

                        // the order field must be in COLUMNS
                        if (columns.includes(orderField)) {
                            return true;
                        } else {
                            this.errorMessage = "ORDER key must be in COLUMNS";
                            return false;
                        }
                    } else {
                        this.errorMessage = "Invalid query string (ORDER must have exactly one field";
                        return false;
                    }
                } else {
                    this.errorMessage = "Invalid keys in OPTIONS (cannot find ORDER)";
                    return false;
                }

            }

    /**
     * inputKeysAreValid returns true if three semantic checks are passed:
     * Semantic checks in order:
     * Check if the first key in COLUMNS is loaded
     * Check if the other keys are different from COLUMNS (if so, then cannot reference more than one dataset)
     * Check if query keys are one of the 8 keys we accept
     */
    // public inputKeysAreValid(query: any, datasetToUse: Dataset): boolean {
    //     // Check if first key in COLUMNS is loaded
    //     if (this.keyIsLoaded(query, datasetToUse)) {
    //         // Check if only one dataset is referenced
    //         if (this.onlyOneDatasetReferenced(query, datasetToUse)) {
    //             // Check if query keys are one of the 8 keys that are allowed
    //             if (this.allKeysAllowed(query)) {
    //                 return true;
    //             } else {
    //                 // TODO: Find out how to fill in the blanks
    //                 this.errorMessage = "Invalid key ___(ex. courses_session)___ in ___(ex. COLUMNS || GT)___"
    //                 return false;
    //             }
    //         } else {
    //             this.errorMessage = "Cannot query more than one dataset";
    //             return false;
    //         }
    //     } else {
    //         this.errorMessage = "Referenced dataset " + "'" + datasetID + "'" +  " not added yet";
    //         return false;
    //     }
    // }
    //
    //     /**
    //      * Helper function for inputKeysAreValid
    //      * Check if key is loaded
    //      * The first key in COLUMNS is the key we're going to load
    //      */
    //     private keyIsLoaded(query: any, datasetToUse: Dataset): boolean {
    //         // get the first key in COLUMNS
    //         let key = query["OPTIONS"]["COLUMNS"][0]; //sets key to be the first item in the query's
    //         return key === Dataset[0]; //Dataset[0] returns the id of the dataset we're using
    //     }
    //
    //     /**
    //      * Helper function for inputKeysAreValid
    //      * Check if only one dataset is referenced
    //      * Look at all other keys and see if they equal the key
    //      */
    //     private onlyOneDatasetReferenced(query: any, datasetID: string): boolean {
    //         let key = query["OPTIONS"]["COLUMNS"][0];
    //
    //     }
    //
    // /**
    //  * runQuery will return a promise:
    //  *      rejects: if something goes wrong
    //  *      fulfills: with query result passed on
    //  *
    //  */
    // // commented out for push
    // public runQuery(query: any, datasetToUse: Dataset): Promise<Array<any>> {
    //     return new Promise((resolve, reject)) => {
    //
    //         let queryResult = null;
    //
    //         // logic functions that return the queryResult
    //
    //         Promise.resolve(queryResult);
    //     }
    // }


    // ************************* FILTER ************************** //
}
