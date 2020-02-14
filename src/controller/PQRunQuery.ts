import Dataset from "./Dataset";
import PQPreQuery from "./PQPreQuery";
import PQFilter from "./PQFilter";
import InsightFacade from "./InsightFacade";
import Log from "../Util";

export default class PQRunQuery extends PQPreQuery {
    // private filter: PQFilter;
    private allSectionsInDataset: any[];

    constructor() {
        super();
        // this.filter = new PQFilter(this.allSectionsInDataset, this.dataSetID);
        this.allSectionsInDataset = [];
    }

    // ================== RUN QUERY ================== //

    public runQuery(query: any, datasetToUse: Dataset): any {
        this.allSectionsInDataset = this.populateAllSections(datasetToUse);
        Log.trace("Finished populating all sections");

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
            queryResults = new PQFilter(
                this.allSectionsInDataset,
                this.dataSetID,
            ).doFilter(query["WHERE"], 0);
            Log.trace("WHERE detected, doing filter...");
            if (typeof queryResults === "string") {
                this.errorMessage = queryResults;
                return this.errorMessage;
            }
        }

        // ================== LENGTH CHECK ================== //
        if (queryResults.length > 5000) {
            return "Too large"; //  InsightFacade performQuery must receive this exact message
        }

        // ====================== TRIM ====================== //
        let resultTrim: any;
        // returns list of sections w/o junk keys (courses_tier)
        resultTrim = this.doTrim(queryResults, query);
        if (typeof resultTrim === "string") {
            this.errorMessage = resultTrim;
            return this.errorMessage;
        } else if (typeof resultTrim === "object") {
            // ====================== ORDER ====================== //
            // DO ORDER
            if (query["OPTIONS"] === undefined || query["OPTIONS"] === null) {
                return "Object.keys will call on undefined or null in doTrim";
            }
            if (Object.keys(query["OPTIONS"]).length === 1) {
                this.filteredResults = resultTrim;
                return this.filteredResults;
            } else {
                this.filteredResults = this.doOrder(resultTrim, query);
                return this.filteredResults;
            }
        } else {
            // doFilter somehow returned something that's neither a list nor a string
            this.errorMessage = "doFilter returned neither string nor list";
            return this.errorMessage;
        }
    }

    // ====================== HELPER FUNCTIONS ====================== //

    /** Populates a list with all sections in the dataset */
    private populateAllSections(dataset: Dataset) {
        let allSectionsHolder = [];
        let numberOfCourses = dataset["data"].length;
        for (let i = 0; i < numberOfCourses; i++) {
            let currentCourse = dataset["data"][i].result;
            let numberOfSectionsInCourse = currentCourse.length;
            for (let j = 0; j < numberOfSectionsInCourse; j++) {
                let currentSection = dataset["data"][i].result[j];
                allSectionsHolder.push(currentSection);
            }
        }
        return allSectionsHolder;
    }

    /**
     * Trims each section according to what's in columns
     * @param filteredList: will be a list of sections, not a list of a list of sections
     * @param query: so we can access the keys in COLUMNS
     */
    private doTrim(filteredList: any[], query: any): any {
        let numOfColumns = query["OPTIONS"]["COLUMNS"].length;
        let trimmedList = [];

        for (let section of filteredList) {
            let trimmedSection = {};
            for (let i = 0; i < numOfColumns; i++) {
                let keyToSelectFor = query["OPTIONS"]["COLUMNS"][i]; // ex. keyToSelectFor = courses_avg

                let key = this.translate(keyToSelectFor); // ex. key = "Avg"
                let value = section[key]; // ex. 97.7
                let object = { [keyToSelectFor]: value }; // ex. {courses_avg: 97}

                // ex. first run: section: {{courses_avg: 97}}
                // ex. second run: section: {{courses_avg: 97}, {courses_dept: "aanb"}}
                Object.assign(trimmedSection, object);
            }

            trimmedList.push(trimmedSection); // ex. trimmedList = [{trimmedS1}, {trimmedS2}, {trimmedS3}]
        }

        return trimmedList;
    }

    /**
     * Translates query key_value format to JSON value format
     * ex. Query has wants to know "courses_avg", so we have to search
     * each section's "Avg" key.
     */
    public translate(queryKey: string): string {
        switch (queryKey) {
            // STRINGS
            case "courses_dept":
                return "Subject";
            case "courses_id":
                return "Course";
            case "courses_instructor":
                return "Professor";
            case "courses_title":
                return "Title";
            case "courses_uuid":
                return "id";

            // NUMBERS
            case "courses_avg":
                return "Avg";
            case "courses_pass":
                return "Pass";
            case "courses_fail":
                return "Fail";
            case "courses_audit":
                return "Audit";
            case "courses_year":
                return "Year";
        }
    }

    /** Order the list of sections according to ORDER key */
    private doOrder(unsortedListOfSections: any, query: any): any[] {
        let sortedList: any[];
        let orderKey = query["OPTIONS"]["ORDER"]; // ex. courses_avg

        // let that = this; Might need to use this to create a tie breaker if hidden secondary ORDER actually matters
        sortedList = unsortedListOfSections.sort(function (a: any, b: any) {
            if (a[orderKey] > b[orderKey]) {
                return 1;
            } else if (a[orderKey] < b[orderKey]) {
                return -1;
            } else {
                return 0;
            }
        });

        return sortedList;
    }
}
