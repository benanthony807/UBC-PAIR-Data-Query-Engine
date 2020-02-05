import PerformQueryHelperQuery from "./PerformQueryHelperQuery";
import Dataset from "./Dataset";
import PerformQueryHelperPreQuery from "./PerformQueryHelperPreQuery";

export default class PerformQueryHelperQueryHelper extends PerformQueryHelperPreQuery {

    /** Helper function for doOrder: Actual logic for running sort. If tie, run tieBreaker. */
    public doSort(unsortedListOfSections: any[], datasetOrderKey: string): any {
        // let that = this; Might need to use this to create a tie breaker if hidden secondary ORDER actually matters
        return unsortedListOfSections.sort(function (a: any, b: any) {
            if (a[datasetOrderKey] > b[datasetOrderKey]) { return 1;
            } else if (a[datasetOrderKey] < b[datasetOrderKey]) { return -1;
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

    /**
     * Helper function for doFilter: returns the obj key of interest so we can go to the correct key
     * in the list in section
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

    // Helper function for runQuery: Populates a list with all sections in the dataset for filtering
    public populateAllSections(dataset: Dataset) {
        // go into each course
        let numberOfDatasetCourses = dataset.getCourses().length;
        for (let i = 0; i < numberOfDatasetCourses; i++) {
            // go into each section
            // for ... of ... returns cannot return course as index below
            let placeHolder = dataset.getCourses()[i].result.length;
            for (let j = 0; j < placeHolder; j++) {
                this.allSectionsInDataset.push(dataset.getCourses()[i].result[j]); } }
    }

}
