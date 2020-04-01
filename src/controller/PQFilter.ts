import PQFilterCheckers from "./PQFilterCheckers";
import PQGeneralHelpers from "./PQGeneralHelpers";

export default class PQFilter {
    private errorMessage: string;
    private readonly allSections: any[];
    private checker: PQFilterCheckers;

    constructor(allSections: any[]) {
        this.checker = new PQFilterCheckers();
        this.allSections = allSections;
        this.errorMessage = "";
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
        if (query === undefined || query === null) {
            return "Object.key error in doFilter";
        }
        let currFilterType = Object.keys(query)[0];

        // ========================= REACHED A LEAF ========================= //
        if (
            currFilterType === "LT" ||
            currFilterType === "GT" ||
            currFilterType === "EQ" ||
            currFilterType === "IS"
        ) {
            // CHECK LEAF
            let leafCheckResult = this.checker.leafCheck(query, currFilterType);
            if (typeof leafCheckResult === "string") {
                return leafCheckResult;
            }

            // RUN LEAF
            return this.doComparison(query, currFilterType);
        }

        // ====================== REACHED A BRANCH ====================== //
        if (
            currFilterType === "AND" ||
            currFilterType === "OR" ||
            currFilterType === "NOT"
        ) {
            let branchGrammarCheckResult = this.checker.branchGrammarCheck(
                query,
                currFilterType,
            );
            if (typeof branchGrammarCheckResult === "string") {
                return branchGrammarCheckResult;
            }
            switch (currFilterType) {
                case "AND":
                    return this.doAndOR(query["AND"], currFilterType);
                case "OR":
                    return this.doAndOR(query["OR"], currFilterType);
                case "NOT":
                    return this.doNot(query["NOT"], localCounter);
            }
        }

        return "Not a valid branch or leaf";
    }

    /** Runs checks on leafs then run matching */
    private doComparison(query: any, currFilterType: string) {
        // ================= CHECK (id_field: value) ================== //
        // CHECK FIELD
        let checkFieldResult = this.checker.checkField(query, currFilterType);
        if (typeof checkFieldResult === "string") {
            return checkFieldResult;
        }

        // CHECK VALUE
        let checkValueResult = this.checker.checkValue(query, currFilterType);
        if (typeof checkValueResult === "string") {
            return checkValueResult;
        }

        // ========================== DO MATCH ======================== //
        let matchResult = this.doMatch(query, currFilterType);
        if (typeof matchResult === "string") {
            return matchResult;
        }
        return matchResult; // a list of matching sections if no errors
    }

    /**
     * Iterates through each section in dataset, compares string or number, returns a selected list;
     */
    private doMatch(query: string, currFilterType: any) {
        let filteredList: any[] = [];

        // Step 1: Set up variables
        let queryKey = Object.keys(query[currFilterType])[0]; // ex. "courses_avg"
        let sectionKey = PQGeneralHelpers.translate(queryKey); // ex. "Avg"

        // Step 2: Iterate through each section in dataset
        for (let section of this.allSections) {
            let queryValue = Object.values(query[currFilterType])[0]; // ex. {"GT": {"courses_avg": 97}} = 97
            let sectionValue = section[sectionKey]; // ex. section["Avg"] = 97 or "aanb"

            // Step 3: Compare and Push

            // STRING
            if (currFilterType === "IS") {
                // There is no * in the middle
                let innerQueryValue: string = queryValue.substring(
                    1,
                    queryValue.length - 1,
                );
                if (
                    !(queryValue === "*" || queryValue === "**") &&
                    innerQueryValue.includes("*")
                ) {
                    return "Illegal *";
                }

                let queryRegex: RegExp = new RegExp(
                    "^" + queryValue.replace(/\*/g, ".*") + "$",
                );
                if (sectionValue.match(queryRegex)) {
                    filteredList.push(section);
                }
            }

            // NUMBER
            if (currFilterType !== "IS") {
                switch (currFilterType) {
                    case "LT":
                        if (sectionValue < queryValue) {
                            filteredList.push(section);
                        }
                        break;
                    case "GT":
                        if (sectionValue > queryValue) {
                            filteredList.push(section);
                        }
                        break;
                    case "EQ":
                        if (sectionValue === queryValue) {
                            filteredList.push(section);
                        }
                        break;
                }
            }
        }

        return filteredList;
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
                return this.errorMessage;
            }

            // result is a subFilteredList
            filteredList.push(result);
        } // add the list of viable sections to this OR's filteredList

        // If there is only one sublist in the filteredList, just return the sublist
        if (filteredList.length === 1) {
            return filteredList[0];
        }
        return this.filterAndOr(filteredList, currFilterType); // narrowDown returns a processed list
    }

    /** Helper function for doFilter: query["NOT"] is input, has one obj (not a list!), returns a filtered list */
    private doNot(query: any, localCounter: number) {
        let myCounter: number;
        if (Object.keys(query)[0] === "NOT") {
            myCounter = 0;
            localCounter++;
        } else {
            myCounter = localCounter + 1;
        }
        let wantedListOfSections: any = [];
        let unwantedListOfSections: any = [];
        let result = this.doFilter(query, localCounter);
        if (typeof result === "string") {
            this.errorMessage = result;
            return this.errorMessage;
        }
        unwantedListOfSections = result;

        if (myCounter % 2 === 1) {
            for (let section of this.allSections) {
                if (!unwantedListOfSections.includes(section)) {
                    wantedListOfSections.push(section);
                }
            }
            return wantedListOfSections;
        }
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
                list2 = filteredList[i + 1];
            }
            let sublist: any = [];
            if (currFilterType === "AND") {
                let placeHolder = list2.length;
                for (let j = 0; j < placeHolder; j++) {
                    if (list1.includes(list2[j])) {
                        sublist.push(list2[j]);
                    }
                }
                // comparison has to be "OR" at this point
            } else {
                sublist = list1;
                let placeHolder2 = list2.length;
                for (let j = 0; j < placeHolder2; j++) {
                    if (!sublist.includes(list2[j])) {
                        sublist.push(list2[j]);
                    }
                }
            }
            filteredList[i + 1] = sublist;
        } // this sets up for the next run
        return filteredList[filteredList.length - 1];
    }

}
