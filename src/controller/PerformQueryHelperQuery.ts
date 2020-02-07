import Dataset from "./Dataset";
import PerformQueryHelperPreQuery from "./PerformQueryHelperPreQuery";
import PerformQueryHelperQueryHelper from "./PerformQueryHelperQueryHelper";
import Log from "../Util";

export default class PerformQueryHelperQuery extends PerformQueryHelperPreQuery {
    private performQueryHelperQH: PerformQueryHelperQueryHelper;
    constructor() {
        super();
        this.performQueryHelperQH = new PerformQueryHelperQueryHelper();
    }
    // runQuery will return a string (error message) if error | returns this.filteredResults
    public runQuery(query: any, datasetToUse: Dataset): any {
        this.allSectionsInDataset = this.performQueryHelperQH.populateAllSections(datasetToUse);
        if (Object.keys(query["WHERE"]).length === 0) { // If WHERE is empty, don't filter, just return all sections
            return this.allSectionsInDataset;
        } else {
            let resultFilter: any;
            resultFilter = this.doFilter(query["WHERE"]);
            if (typeof resultFilter === "string") { // then we've received an error message
                this.errorMessage = resultFilter;
                return this.errorMessage;
            } else if (typeof resultFilter === "object") { // doFilter ran successfully and returned a list
                // DO LENGTH CHECK
                if (resultFilter.length > 5000) {
                    let tooLargeErrMsg = "Too large"; //  InsightFacade performQuery must receive this exactly message
                    return tooLargeErrMsg;
                }
                // DO TRIM
                let resultTrim: any;
                // returns list of sections w/o junk keys (courses_tier)
                resultTrim = this.performQueryHelperQH.doTrim(resultFilter, query);
                if (typeof resultTrim === "string") {
                    this.errorMessage = resultTrim;
                    return this.errorMessage;
                } else if (typeof resultTrim === "object") {
                    // DO ORDER
                    if (Object.keys(query["OPTIONS"]).length === 1) {
                        this.filteredResults = resultTrim;
                        return this.filteredResults;
                    } else {
                        this.filteredResults = this.performQueryHelperQH.doOrder(resultTrim, query);
                        return this.filteredResults; }
                } else { // doFilter somehow returned something that's neither a list nor a string
                    this.errorMessage = "doFilter returned neither string nor list";
                    return this.errorMessage; }
                }
        }
    }

    // Helper function for runQuery: recursively traverse branching nested AND / OR / NOT conditions
    // IMPORTANT for upstream error handling: Returns a list of good, otherwise RETURNS A STRING IF ERROR.
    public doFilter(query: any): any {
        let currFilterSubType = Object.keys(query)[0]; // LT GT EQ IS AND OR NOT
        // CHECK if currFilterSubType Error:
        if (currFilterSubType === "0") {return "currFilterSubType error"; }

        // REACHED A LEAF
        if (currFilterSubType === "LT" || currFilterSubType === "GT" || currFilterSubType === "EQ" ||
            currFilterSubType === "IS") {

            // CHECK MULTIPLE DATASETS ERROR
            let currKeyVal = Object.keys(query[currFilterSubType])[0]; // ex. courses_avg
            let currKey = currKeyVal.substring(0, currKeyVal.indexOf("_")); // isolates the id, ex. "courses"
            if (currKey !== this.dataSetID) { // okay to assume this dataSetId is one of the loaded courses in datsets
                return "Cannot query more than one dataset"; }

            // CHECK IF LEAF HAS MORE/LESS THAN ONE KEY ERROR
            let leafLength = Object.keys(query[currFilterSubType]).length;
            if (leafLength > 1) {
                return currFilterSubType + " cannot have more than one key";
            } else if (leafLength === 0) {
                return currFilterSubType + " does not have any objects"; }

            // RUN THE LEAF
            if (currFilterSubType === "IS") {
                let resultString = this.doStringComparison(query, "IS"); // ex query = {"GT": {"courses_avg": 97}}
                if (typeof resultString === "string") {
                    return resultString;
                } else {
                    return resultString; }
            } else if (currFilterSubType === "LT" || currFilterSubType === "GT" || currFilterSubType === "EQ") {
               let resultMath = this.doMathComparison(query, currFilterSubType);
               if (typeof resultMath === "string") {
                   return resultMath;
               } else {
                   return resultMath;
               } }
        }

        // REACHED A BRANCH
        if (currFilterSubType === "AND") {
            // Make sure AND has one or more items
            if (query["AND"].length >= 1) {
                return this.runAnd(query["AND"]);
            } else {
                return "AND must be a non-empty array"; } }
        if (currFilterSubType === "OR") {
            if (query["OR"].length >= 1) {
                return this.runOr(query["OR"]);
            } else {
                return "OR must but a non-empty array"; } }
        if (currFilterSubType === "NOT") {
            if (Object.keys(query["NOT"]).length === 1) {
                if (typeof query["NOT"] === "object") {
                    return this.runNot(query["NOT"]);
                } else {
                    return "NOT's value must be object"; }
            } else {
                return "NOT should only have 1 key, has " + Object.keys(query["NOT"]).length; } }
    }

    // Helper function for doFilter: check fields -> check value types -> add section to list
    private doStringComparison(query: any, currFilterSubType: string): any {
        let filteredList: any[] = [];
        // CHECK IF FIELD EXISTS
        // only returns true, otherwise returns error message
        let doesFieldExistResult = this.performQueryHelperQH.doesFieldExist(query, currFilterSubType);
        if (typeof doesFieldExistResult !== "boolean") {
            return doesFieldExistResult;
        } else {
            // CHECK IF KEY TYPE IS APPROPRIATE
            let queryKey = Object.keys(query[currFilterSubType])[0]; // get query key: ex "courses_dept"
            let objectKey = this.performQueryHelperQH.setObjectKeyOfInterest(queryKey); // returns string

            // ex. We don't want courses_avg when comparing strings
            if (!this.performQueryHelperQH.isKeyTypeAppropriate(queryKey, currFilterSubType)) {
                return "key type is inappropriate";
            }

            // CHECK IF VALUE TYPES MATCH
            let typeMatchResult = this.performQueryHelperQH.doesValueTypeMatch(query, currFilterSubType);
            if (typeof typeMatchResult !== "boolean") {
                return doesFieldExistResult;
            } else {

                // COMPARE AND PUSH
                for (let section of this.allSectionsInDataset) {
                    let objectValue = section[objectKey]; // ex. section["courses_dept"] -> aanb
                    let queryValue = Object.values(query[currFilterSubType])[0];
                    if (typeof queryValue === "string") { // typeof to satisfy webstorm unknown type error
                        // SPECIAL CASES
                        // courses_uuid / id is actually a number. Need to turn it into a string
                        if (objectKey === "id") {
                            objectValue = objectValue.toString();
                        }
                        // Check if strings match. If so, push to filteredList
                        if (this.performQueryHelperQH.stringsMatch(objectValue, queryValue)) {
                            filteredList.push(section);
                        }
                    } else {
                        return "doStringComparison received non-string to compare";
                    }
                }
                return filteredList;
            }
        }
    }
    /** Helper function for doFilter: check fields | check value types | add section to list if pass requirements */
    private doMathComparison(query: any, currFilterSubType: string): any {
        let filteredList: any[] = [];

        // CHECK IF FIELD EXISTS
        // only returns true, otherwise returns error message
        let doesFieldExistResult = this.performQueryHelperQH.doesFieldExist(query, currFilterSubType);
        if (typeof doesFieldExistResult !== "boolean") {
            return doesFieldExistResult;
        } else {
            // CHECK IF KEY TYPE IS APPROPRIATE
            let queryKey = Object.keys(query[currFilterSubType])[0]; // get query key: ex "courses_dept"
            let objectKey = this.performQueryHelperQH.setObjectKeyOfInterest(queryKey); // returns string
            // ex. We don't want courses_avg when comparing strings
            if (!this.performQueryHelperQH.isKeyTypeAppropriate(queryKey, currFilterSubType)) {
                return "key type is inappropriate";
            }
            // CHECK IF VALUE TYPES MATCH
            let typeMatchResult = this.performQueryHelperQH.doesValueTypeMatch(query, currFilterSubType);
            if (typeof typeMatchResult !== "boolean") {
                return doesFieldExistResult;
            } else {
                // COMPARE AND PUSH
                for (let section of this.allSectionsInDataset) {
                    let objectValue = section[objectKey]; // ex. section["courses_avg"] -> 97

                    // SPECIAL CASES
                    // Because courses_year / Year returns a string (ex. "2015"), it must be turned into an int
                    if (objectKey === "Year") {
                        // If we're looking for year, we'll need to set section:Overall's year to 1900
                        if (section["Section"] === "overall") {
                            objectValue = 1900;
                        }
                        objectValue = Number(objectValue);
                    }

                    let queryValue = Object.values(query[currFilterSubType])[0];

                    switch (currFilterSubType) {
                        case "LT":
                            if (objectValue < queryValue) {
                                filteredList.push(section); }
                            break;
                        case "GT":
                            if (objectValue > queryValue) {
                                filteredList.push(section); }
                            break;
                        case "EQ":
                            if (objectValue === queryValue) {
                                filteredList.push(section); }
                            break; }
                }
                return filteredList;
            }
        }
    }
    // Helper function for doFilter: populates the AND sublist, applies the AND requirements to narrow down the list
    // returns list of sections satisfying the AND
    private runAnd(listOflistOfObjects: any): any { // query["AND"] is passed in and has a list of a list of sections
        let filteredList: any[] = [];

        // Traverse branch, reach a leaf, put the resulting section of that leaf into DoAND's filtered list.
        let placeHolder = listOflistOfObjects.length;
        for (let i = 0; i < placeHolder; i++) {
            let result = this.doFilter(listOflistOfObjects[i]);
            if (typeof result === "string") { // then we've received an error message
                this.errorMessage = result;
                return this.errorMessage;
            } else if (typeof result === "object") { // result is a subFilteredList
                filteredList.push(result); } // add the list of viable sections to this OR's filteredList
        }

        // Now that AND's filteredList has a value, if there is only one list in the filteredList, just return it
        if (filteredList.length === 1) {
            return filteredList[0];
        } else {
            return this.filterViaAndOr(filteredList, "AND"); // narrowDown returns a processed list
        }
    }
    /** Helper function for doFilter: Takes a list of filtered lists and produces a single list of union sections */
    private runOr(listOflistOfObjects: any): any { // query["OR"] is passed in and has a list of a list of sections
        let filteredList: any[] = [];

        // Traverse branch, reach a leaf, put the resulting section of that leaf into DoOR's filtered list.
        let placeHolder = listOflistOfObjects.length;
        for (let i = 0; i < placeHolder; i++) {
            let result = this.doFilter(listOflistOfObjects[i]);
            if (typeof result === "string") { // then we've received an error message
                this.errorMessage = result;
                return this.errorMessage;
            } else if (typeof result === "object") { // result is a subFilteredList
                filteredList.push(result); // add the list of viable sections to this OR's filteredList
            }
        }

        // Now that OR's filteredList has a value, if there is only one list in the filteredList, just return it
        if (filteredList.length === 1) {
            return filteredList[0];
        } else {
            return this.filterViaAndOr(filteredList, "OR"); } // narrowDown returns a processed list
    }
    /** Helper function for doFilter: query["NOT"] is input, has one obj (not a list!), returns a filtered list */
    private runNot(query: any) {
        // CHECK for double NOT - if so, just continue query as normal from the second NOT
        // ex {"NOT": {"NOT": {"GT": {"courses_avg": 90}}}} -> {"GT": {"courses_avg": 90}}
        if (Object.keys(query)[0] === "NOT") {
            return this.doFilter(query["NOT"]); }
        let wantedListOfSections: any = [];
        let unwantedListOfSections: any = [];
        unwantedListOfSections = this.doFilter(query); // ex. query = {"GT": {"courses_avg": 90}}
        for (let section of this.allSectionsInDataset) {
            // if this section is NOT in list of unwanted, it must be wanted
            if (!this.performQueryHelperQH.isAinB(section, unwantedListOfSections)) {
                wantedListOfSections.push(section); } }
        return wantedListOfSections;
    }
    // Helper function for runAnd and runOr: Apply AND or OR logic
    private filterViaAndOr(filteredList: any[], comparison: string): any {
        for (let i = 0; i < filteredList.length - 1; i++) {
            let list1: any = filteredList[i]; // current list
            let list2: any = filteredList[i + 1]; // the list beside it
            let sublist: any = [];
            if (comparison === "AND") {
                let placeHolder = list2.length;
                for (let j = 0; j < placeHolder; j++) {
                    if (list1.includes(list2[j])) {
                        sublist.push(list2[j]); } }
                // comparison has to be "OR" at this point
            } else {
                let placeHolder2 = list2.length;
                for (let j = 0; j < placeHolder2; j++) {
                    if (!list1.includes(list2[j])) {
                        sublist.push(list2[j]); } } }
            filteredList[i + 1] = sublist; // this sets up for the next run
        }
        // filteredList[i + 1] has the final results and is in position length - 1
        return filteredList[filteredList.length - 1];
    }
}
