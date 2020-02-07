import PerformQueryHelperQuery from "./PerformQueryHelperQuery";
import Dataset from "./Dataset";
import PerformQueryHelperPreQuery from "./PerformQueryHelperPreQuery";

export default class PerformQueryHelperQueryHelper extends PerformQueryHelperPreQuery {

    /** Helper function for doOrder: Actual logic for running sort. If tie, run tieBreaker. */
    public doSort(unsortedListOfSections: any[], orderKey: string): any {
        // let that = this; Might need to use this to create a tie breaker if hidden secondary ORDER actually matters
        return unsortedListOfSections.sort(function (a: any, b: any) {
            if (a[orderKey] > b[orderKey]) { return 1;
            } else if (a[orderKey] < b[orderKey]) { return -1;
            } else { return 0; } }); // it's a tie. According to Piazza, there might be a hidden secondary ORDER
    }

    /**
     * Helper function for doFilter
     * checks if value types match
     * ex. is key_field: "string" a string
     */
    public doesValueTypeMatch(query: any, currFilterSubType: string): any {
        /**
         * ex. reached leaf "GT"
         * query = {"GT": {"courses_avg": 97}}
         * Object.values(query["GT"])[0] = 97
         * without [0] might return a list?. [0] tells it to return a value for sure
         */
        let queryValue = Object.values(query[currFilterSubType])[0]; // 97 or "adhe"
        if (currFilterSubType === "IS") {
            if (typeof queryValue === "string") {
                return true;
            } else {
                return "Invalid value type in " + currFilterSubType + ", should be string";
            }
            // LT GT EQ
        } else {
            if (typeof queryValue === "number") {
                return true;
            } else {
                return "Invalid value type in " + currFilterSubType + ", should be number";
            }
        }
    }

    /** Helper function for doFilter->doStringComparison: Uses regex to check if strings match */
    public stringsMatch(objectValue: string, queryValue: string): any[] {
        // ex. queryValue = "aanb"
        let queryRegex: RegExp =  new RegExp("^" + queryValue.replace("*", ".*") + "$");
        return (objectValue.match(queryRegex)); }

    /** Helper function for runNot: if section is in list of unwanted sections, return true */
    public isAinB(section: any, unwantedListOfSections: any[]) {
        let placeHolder = unwantedListOfSections.length;
        for (let i = 0; i < placeHolder; i++) {
            return unwantedListOfSections[i] === section; } }

    /** Translator: returns the obj key of interest so we can go to the correct key in Section
     * ex. section["courses_avg"] = undefined
     * ex. "courses_avg" -> "Avg"
     * ex. section["Avg"] = 97.77
     */
    public setObjectKeyOfInterest(queryKey: string): string {
        switch (queryKey) {
            // STRINGS
            case "courses_dept": return "Subject";
            case "courses_id": return "Course";
            case "courses_instructor": return "Professor";
            case "courses_title": return "Title";
            case "courses_uuid": return "id"; // Note: uuid is returned as number

            // NUMBERS
            case "courses_avg": return "Avg";
            case "courses_pass": return "Pass";
            case "courses_fail": return "Fail";
            case "courses_audit": return "Audit";
            case "courses_year": return "Year"; } // Note: year is returned as string
    }

    /** Helper function for runQuery: Populates a list with all sections in the dataset for filtering */
    public populateAllSections(dataset: Dataset) {
        // go into each course
        let allSectionsHolder = [];
        let numberOfDatasetCourses = dataset["courses"].length;
        for (let i = 0; i < numberOfDatasetCourses; i++) {
            let placeHolder = dataset["courses"][i].result.length;
            for (let j = 0; j < placeHolder; j++) {
                allSectionsHolder.push(dataset["courses"][i].result[j]); } }
        return allSectionsHolder;
    }

    /**
     * Take a list of sections, trim the sections according to what's in columns, return the a list of trimmed sections
     * @param filteredList: will be a list of sections, not a list of a list of sections
     * @param query: so we can access the keys in COLUMNS
     */
    public doTrim(filteredList: any[], query: any): any {
        let numOfColumns = query["OPTIONS"]["COLUMNS"].length;
        let trimmedList = [];

        for (let section of filteredList) {

            let trimmedSection = {};
            for (let i = 0; i < numOfColumns; i++) {
                let keyToSelectFor = (query["OPTIONS"]["COLUMNS"][i]); // ex. keyToSelectFor = courses_avg

                let key = this.setObjectKeyOfInterest(keyToSelectFor); // ex. key = "Avg"
                let value = section[key]; // ex. 97.7
                let object = {[keyToSelectFor]: value}; // ex. {courses_avg: 97}

                // ex. first run: section: {{courses_avg: 97}}
                // ex. second run: section: {{courses_avg: 97}, {courses_dept: "aanb"}}
                Object.assign(trimmedSection, object);
            }

            trimmedList.push(trimmedSection); // ex. trimmedList = [{trimmedS1}, {trimmedS2}, {trimmedS3}]
        }

        return trimmedList;
    }

    public isKeyTypeAppropriate(queryKey: string, currentFilterSubtype: string) {
        if (currentFilterSubtype === "IS") {
            return queryKey === "courses_dept" ||
                queryKey === "courses_id" ||
                queryKey === "courses_instructor" ||
                queryKey === "courses_title" ||
                queryKey === "courses_uuid";
            } else { // currentFilterSubtype will be "GT LS EQ"
            return queryKey === "courses_avg" ||
                queryKey === "courses_pass" ||
                queryKey === "courses_fail" ||
                queryKey === "courses_audit" ||
                queryKey === "courses_year";
        }
    }

    /**
     * Order the list of sections according to ORDER key
     * @param unsortedListOfSections
     * @param query: so we can get ORDER key
     */
    public doOrder (unsortedListOfSections: any, query: any): any[] {
        let sortedList: any[];
        let orderKey = query["OPTIONS"]["ORDER"]; // ex. courses_avg

        sortedList = this.doSort(unsortedListOfSections, orderKey);
        return sortedList;
    }

    /** Helper function for doFilter: checks if a key's field exists in key_field */
    public doesFieldExist(query: any, currFilterSubType: string): any {
        // ex query {"GT": {"courses_avg": 97}}
        let keyField = Object.keys(query[currFilterSubType])[0]; // ex. "courses_avg"
        for (let item of this.listOfAcceptableKeyFields) {
            if (keyField === item) {
                return true; } }
        return ("Invalid key " + keyField + " in " + currFilterSubType);
    }

}
