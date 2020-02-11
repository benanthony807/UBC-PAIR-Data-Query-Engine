export default class PQFilter {
    public acceptableStringFields: string[];
    public acceptableNumberFields: string[];
    private errorMessage: string;
    private readonly allSections: any[];
    private readonly datasetID: string;

    constructor(allSections: any[], datasetID: string) {
        this.allSections = allSections;
        this.errorMessage = "";
        this.datasetID = datasetID;
        this.acceptableStringFields = ["dept", "id", "instructor", "title", "uuid"];
        this.acceptableNumberFields = ["avg", "pass", "fail", "audit", "year"];
    }

    /**
     * Main part of filter that is recursively travelled through
     * Two main behavior:
     *      Reach a Leaf (IS, LT, GT, EQ)
     *      Reach a Branch (AND, OR, NOT)
     * @param query: The initial query is passed in as query["WHERE"]
     * @param localCounter: Used to keep track of number of consecutive NOTs
     * IMPORTANT for upstream error handling: Returns a list of good, otherwise RETURNS A STRING IF ERROR.
     */
    public doFilter(query: any, localCounter: number): any {
        // Set current filter to: LT GT EQ IS AND OR NOT
        if (query === undefined || query === null) { return "Object.key error in doFilter"; }
        let currFilterType = Object.keys(query)[0];

        // ========================= REACHED A LEAF ========================= //
        if (currFilterType === "LT" || currFilterType === "GT" || currFilterType === "EQ" || currFilterType === "IS") {

            // CHECK LEAF
            let leafCheckResult = this.leafCheck(query, currFilterType);
            if (typeof leafCheckResult === "string") {
                return leafCheckResult; }

            // RUN LEAF
            return this.doComparison(query, currFilterType); }

        // ====================== REACHED A BRANCH ====================== //
        if (currFilterType === "AND" || currFilterType === "OR" || currFilterType === "NOT") {
            let branchGrammarCheckResult = this.branchGrammarCheck(query, currFilterType);
            if (typeof branchGrammarCheckResult === "string") {return branchGrammarCheckResult; }
            switch (currFilterType) {
                case "AND": return this.doAndOR(query["AND"], currFilterType);
                case "OR": return this.doAndOR(query["OR"], currFilterType);
                case "NOT": return this.doNot(query["NOT"], localCounter); } }

        return "Not a valid branch or leaf";
    }

    /** Runs checks on leafs then run matching */
    private doComparison(query: any, currFilterType: string) {

        // ================= CHECK (id_field: value) ================== //
        // CHECK FIELD
        let checkFieldResult = this.checkField(query, currFilterType);
        if (typeof checkFieldResult === "string") { return checkFieldResult; }

        // CHECK VALUE
        let checkValueResult = this.checkValue(query, currFilterType);
        if (typeof checkValueResult === "string") { return checkValueResult; }

        // ========================== DO MATCH ======================== //
        let matchResult = this.doMatch(query, currFilterType);
        if (typeof matchResult === "string") { return matchResult; }
        return matchResult; // a list of matching sections if no errors
    }

    /**
     * Iterates through each section in dataset, compares string or number, returns a selected list;
     */
    private doMatch(query: string, currFilterType: any) {
        let filteredList: any[] = [];

        // Step 1: Set up variables
        let queryKey = Object.keys(query[currFilterType])[0]; // ex. "courses_avg"
        let sectionKey = this.translate(queryKey); // ex. "Avg"

        // Step 2: Iterate through each section in dataset
        for (let section of this.allSections) {
            let queryValue = Object.values(query[currFilterType])[0]; // ex. {"GT": {"courses_avg": 97}} = 97
            let sectionValue = section[sectionKey]; // ex. section["Avg"] = 97

        // Step 3: Compare and Push

            // STRING
            if (currFilterType === "IS") {
                // There is no * in the middle
                let innerQueryValue: string = queryValue.substring(1, queryValue.length - 1);
                if (!(queryValue === "*" || queryValue === "**") && innerQueryValue.includes("*")) {
                    return "Illegal *"; }

                let queryRegex: RegExp =  new RegExp("^" + queryValue.replace(/\*/g, ".*") + "$");
                if (sectionValue.match(queryRegex)) {
                    filteredList.push(section);
                } }

            // NUMBER
            if (currFilterType !== "IS") {
                switch (currFilterType) {
                    case "LT":
                        if (sectionValue < queryValue) {
                            filteredList.push(section); }
                        break;
                    case "GT":
                        if (sectionValue > queryValue) {
                            filteredList.push(section); }
                        break;
                    case "EQ":
                        if (sectionValue === queryValue) {
                            filteredList.push(section); }
                        break; } }
        }

        return filteredList;
    }

    public translate(queryKey: string): string {
        switch (queryKey) {
            // STRINGS
            case "courses_dept":        return "Subject";
            case "courses_id":          return "Course";
            case "courses_instructor":  return "Professor";
            case "courses_title":       return "Title";
            case "courses_uuid":        return "id"; // Note: uuid is returned as number

            // NUMBERS
            case "courses_avg":         return "Avg";
            case "courses_pass":        return "Pass";
            case "courses_fail":        return "Fail";
            case "courses_audit":       return "Audit";
            case "courses_year":        return "Year"; } // Note: year is returned as string
    }

    /**
     * Populates the AND sublist, narrows down sublist via UNION, returns final list
     * @param listOflistOfObjects: AND will receive at least two sublists.
     *      ex. {"AND": [{"GT": {"courses_avg": 90}}, {"IS": {"courses_dept": "adhe"}}]}
     *      Will get one sublist from GT and one sublist from IS
     *      Then it will put the UNION of the sublists into a final list
     */
    private doAndOR(listOflistOfObjects: any, currFilterType: string): any {
        let filteredList: any[] = [];

        let numberOfSublists = listOflistOfObjects.length;

        for (let i = 0; i < numberOfSublists; i++) {
            // RECURSION to populate each sublist
            let result = this.doFilter(listOflistOfObjects[i], 0);

            if (typeof result === "string") {
                this.errorMessage = result;
                return this.errorMessage; }

            // result is a subFilteredList
            filteredList.push(result); }// add the list of viable sections to this OR's filteredList

        // If there is only one sublist in the filteredList, just return the sublist
        if (filteredList.length === 1) { return filteredList[0]; }
        return this.filterAndOr(filteredList, currFilterType); // narrowDown returns a processed list
    }

    /** Helper function for doFilter: query["NOT"] is input, has one obj (not a list!), returns a filtered list */
    private doNot(query: any, localCounter: number) {
        let myCounter: number;
        if (Object.keys(query)[0] === "NOT") {
            myCounter = 0;
            localCounter++;
        } else {
            myCounter = localCounter + 1; }
        let wantedListOfSections: any = [];
        let unwantedListOfSections: any = [];
        let result = this.doFilter(query, localCounter);
        if (typeof result === "string") {
            this.errorMessage = result;
            return this.errorMessage; }
        unwantedListOfSections = result;

        if (myCounter % 2 === 1) {
            for (let section of this.allSections) {
                if (!unwantedListOfSections.includes(section)) {
                    wantedListOfSections.push(section); } }
            return wantedListOfSections; }
        return unwantedListOfSections;
    }

    /** Apply AND or OR logic */
    private filterAndOr(filteredList: any[], currFilterType: string): any {
        for (let i = 0; i < filteredList.length - 1; i++) {
            let list1: any;
            let list2: any;
            if (filteredList[i].length < filteredList[i + 1].length) {
                list1 = filteredList[i + 1];
                list2 = filteredList[i];
            } else {
                list1 = filteredList[i];
                list2 = filteredList[i + 1]; }
            let sublist: any = [];
            if (currFilterType === "AND") {
                let placeHolder = list2.length;
                for (let j = 0; j < placeHolder; j++) {
                    if (list1.includes(list2[j])) {
                        sublist.push(list2[j]); } }
                // comparison has to be "OR" at this point
            } else {
                sublist = list1;
                let placeHolder2 = list2.length;
                for (let j = 0; j < placeHolder2; j++) {
                    if (!sublist.includes(list2[j])) {
                        sublist.push(list2[j]); } } }
            filteredList[i + 1] = sublist; } // this sets up for the next run
        return filteredList[filteredList.length - 1];
    }

    /** Runs multiple checks on leaves | @param currFilterType: One of GT LT EQ IS AND OR NOT */
    private leafCheck(query: any, currFilterType: string) {
        // Step 1: undefined / null check
        if (query[currFilterType] === undefined || query[currFilterType] === null) {
            return "object.Keys will be called on undefined / null in doFilter"; }
        // Step 2: Leaf has one property
        let leafLength = Object.keys(query[currFilterType]).length;
        if (leafLength !== 1) {
            return currFilterType + " must have exactly one property"; }
        // Step 3: Leaf does not refer to multiple datasets
        let currKey = Object.keys(query[currFilterType])[0]; // ex. courses_avg
        let currID = currKey.split("_")[0]; // isolates the id, ex. "courses"
        if (currID !== this.datasetID) {
            return "Cannot query more than one dataset"; }
        // Step 4: Leaf is an object, not an array
        if (typeof query[currFilterType] !== "object" || Array.isArray(query[currFilterType])) {
            return currFilterType + " must be an object"; }
    }

    /** Runs grammar checks on branches */
    private branchGrammarCheck(query: any, currFilterType: string): any {
        if (currFilterType === "AND") {
            if (query["AND"].length === 0 || !Array.isArray(query["AND"])) {
                return "AND must be a non-empty array";
            } else { return true; }}

        if (currFilterType === "OR") {
            if (query["OR"].length === 0 || !Array.isArray(query["OR"])) {
                return "OR must be a non-empty array";
            } else { return true; }}

        // Must be NOT at this point
        if (query["NOT"] === undefined || query["NOT"] === null) {
            return "object.Keys will be called on undefined / null before doNot"; }
        if (Object.keys(query["NOT"]).length !== 1 || typeof query["NOT"] !== "object") {
            return "NOT must be a single object";
        }
        return true;
    }

    /**
     * Checks the FIELD in id_field: value
     * Condition: IS field must be string types: dept, instructor, etc
     * Condition: LT, GT, EQ field must be number types: year, avg, etc
     */
    private checkField(query: any, currFilterType: string): any {
        // Step 1: Guard for Object.keys
        if (query[currFilterType] === undefined || query[currFilterType] === null) {
            return "object.Keys null/undefined in checkField"; }

        // Step 2: Set up variables
        let key = Object.keys(query[currFilterType])[0]; // ex. "courses_avg"
        let leafField = key.substring(key.indexOf("_") + 1); // ex. "avg"

        // Step 3: Compare fields depending on filter type
        if (currFilterType === "IS") {
            if (!this.acceptableStringFields.includes(leafField)) {
                return ("Invalid/Inappropriate key " + key + " in " + currFilterType);
            } else { return true; } }
        // GT LT EQ
        if (!this.acceptableNumberFields.includes(leafField)) {
                return ("Invalid/Inappropriate key " + key + " in " + currFilterType); }
        return true;
    }

    /** Checks the VALUE in id_field: value | IS field must be string | LT GT EQ field must be number */
    private checkValue(query: any, currFilterType: string) {
        let value = Object.values(query[currFilterType])[0];
        switch (currFilterType) {
            case "IS": if (typeof value !== "string") {
                return "Invalid value type in " + currFilterType + ", should be string";
            } else { return true; }

            case "LT":
            case "GT":
            case "EQ": if (typeof value !== "number") {
                return "Invalid value type in " + currFilterType + ", should be number"; } }
    }

}
