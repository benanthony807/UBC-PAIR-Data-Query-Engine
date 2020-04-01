import PQPreQSyntax from "./PQPreQSyntax";
import PQGeneralHelpers from "./PQGeneralHelpers";

export default class PQPreQTransfChecker {
    public errorMessage: string;
    public static listOfApplyKeys: string[] = [];
    private helpers: PQGeneralHelpers;

    constructor() {
        this.helpers = new PQGeneralHelpers();
    }

    public isTransformationsValid(query: any): any {
        let transformations = query["TRANSFORMATIONS"];
        // Step 1: TRANSFORMATIONS must have 2 keys
        if (Object.keys(transformations).length !== 2) {
            return "TRANSFORMATIONS must have 2 keys";
        }
        // Step 2: The two keys of TRANSFORMATIONS are GROUP and APPLY, no need to be in order
        if (!(Object.keys(transformations).includes("GROUP") && Object.keys(transformations).includes("APPLY"))) {
            return"The two keys of TRANSFORMATIONS must be GROUP and APPLY";
        }

        // Step 3: Check Group and Apply
        // Error message is set in below methods
        if (!(this.isGroupSyntaxValid(query) && this.isApplySyntaxValid(query))) {
            return this.errorMessage;
        }

        // Passed all tests
        return true;
    }

    /** Note: order of steps is important  */
    public isGroupSyntaxValid(query: any): boolean {
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
        return true;
    }

    public isGroupSemanticsValid(query: any): boolean {
        let group = query["TRANSFORMATIONS"]["GROUP"];

        for (let item of group) { // "courses_title"
            // Step 1: GROUP has valid keys
            let field = item.substring(item.indexOf("_") + 1); // "title"
            // if (!(PQGeneralHelpers.listOfAcceptableFields.includes(field))) {
            //     this.errorMessage = "Error in GROUP: Must be a valid field";
            //     return false;
            // }
            if (PQGeneralHelpers.dataSetKind === "courses") {
                if (!(PQGeneralHelpers.listOfAcceptableCoursesFields.includes(field))) {
                    this.errorMessage = "Error in GROUP: Must be a valid courses field";
                    return false;
                }
            } else { // PQGeneralHelpers.dataSetKind === "rooms"
                if (!(PQGeneralHelpers.listOfAcceptableRoomsFields.includes(field))) {
                    this.errorMessage = "Error in GROUP: Must be a valid rooms field";
                    return false;
                }
            }

            // Step 2: GROUP does not reference multiple datasets
            let id = item.substring(0, item.indexOf("_")); // "courses"
            if (id !== this.helpers.getDataSetID()) {
                this.errorMessage = "Error in GROUP: Cannot query more than one dataset";
                return false;
            }
        }

        return true;
    }

    public isApplySyntaxValid(query: any): boolean {
        let apply = query["TRANSFORMATIONS"]["APPLY"];
        // Step 1: APPLY is a list
        if (!Array.isArray(apply)) {
            this.errorMessage = "APPLY must be an array";
            return false;
        }
        // Step 2: APPLY has at least 1 item in it
        // if (!(apply.length >= 1)) {
        //     this.errorMessage = "APPLY must have at least 1 item in it";
        //     return false;
        // }
        return true;
    }

    public isApplySemanticsValid(query: any): boolean {
        let apply = query["TRANSFORMATIONS"]["APPLY"];
        let numOfApplyKeys = Object.values(apply).length;
        for (let i = 0; i < numOfApplyKeys; i++) {
            let applyChild: any = Object.values(apply)[i]; // {"overallAvg" { "AVG": "courses_avg" } }
            let applyGrandchild: any = Object.values(applyChild)[0]; // { "AVG": "courses_avg" }

            if (!this.isGrandchildrenValid(applyGrandchild)) {
                return false; // error message already set in above method
            }
        }
        // Step 10: APPLY keys do not have an _
        for (let key of PQPreQTransfChecker.listOfApplyKeys) {
            if (!(key.indexOf("_") === -1)) {
                this.errorMessage = "Cannot have underscore in applyKey";
                return false;
            }
        }
        // Step 11: NO duplicate APPLY keys
        if (this.hasDuplicates(PQPreQTransfChecker.listOfApplyKeys)) {
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
        if (!(applyGrandchildKey === "AVG" || applyGrandchildKey === "MAX" || applyGrandchildKey === "MIN" ||
            applyGrandchildKey === "SUM" || applyGrandchildKey === "COUNT")) {
            this.errorMessage = "APPLY grandchild key should be one of AVG / MAX / MIN / COUNT / SUM";
            return false;
        }

        // Step 6: APPLY'S grandchild field exists
        // ex. { "overallAvg": { "AVG": "courses_avg" } } -> avg must exist
        let applyGrandchildValue: any = Object.values(applyGrandchild)[0]; // "courses_avg"
        if (typeof applyGrandchildValue !== "string") {
            this.errorMessage = "Invalid apply rule target key";
            return false;
        }
        let field = applyGrandchildValue.substring(applyGrandchildValue.indexOf("_") + 1); // "avg"

        if (this.isFieldContextuallyOkay(field, applyGrandchildKey) === false) {
            return false;
        }

        // Step 8: APPLY's grandchild id should not reference multiple datasets
        let id = applyGrandchildValue.substring(0, applyGrandchildValue.indexOf("_")); // "courses"
        if (id !== this.helpers.getDataSetID()) {
            this.errorMessage = "Error in APPLY: Cannot query more than one dataset";
            return false;
        }

        return true;
    }

    private isFieldContextuallyOkay(field: any, applyGrandchildKey: any): boolean {
        if (PQGeneralHelpers.dataSetKind === "courses") {
            if (!PQGeneralHelpers.listOfAcceptableCoursesFields.includes(field)) {
                this.errorMessage = "Must be a valid courses field";
                return false;
            }
        } else { // PQGeneralHelpers.dataSetKind === "rooms"
            if (!PQGeneralHelpers.listOfAcceptableRoomsFields.includes(field)) {
                this.errorMessage = "Must be a valid rooms field";
                return false;
            }
        }

        // Step 7: APPLY's grandchild value should have a typeof number for MAX/MIN/AVG/SUM
        if (applyGrandchildKey !== "COUNT")  { // applyGrandchildKey will be one of AVG MAX MIN SUM
            if (PQGeneralHelpers.dataSetKind === "courses") {
                if (!PQGeneralHelpers.acceptableCoursesNumberFields.includes(field)) {
                    return false;
                }
            } else { // PQGeneralHelpers.dataSetKind === "rooms")
                if (!PQGeneralHelpers.acceptableRoomsNumberFields.includes(field)) {
                    return false;
                }
            }
        }
        return true;
    }

    private hasDuplicates(list: any): boolean {
        let dupListCounts: any = [];
        if (list.length === 1) {
            return false;
        }
        for (let i = 0; i <= list.length; i++) {
            if (dupListCounts[list[i]] === undefined) {
                dupListCounts[list[i]] = 1;
            } else {
                return true;
            }
        }
        return false;
    }

    public populateListOfApplyKeys(query: any) {
        let apply = query["TRANSFORMATIONS"]["APPLY"];
        // Set up list of ApplyKeys ex. ["overallAvg", "hello"]
        let listOfApplyKeysPreFlat: any = [];
        let numOfApplyKeys = Object.values(apply).length;
        for (let i = 0; i < numOfApplyKeys; i++) {
            listOfApplyKeysPreFlat.push(Object.keys(Object.values(apply)[i]));
        }
        PQPreQTransfChecker.listOfApplyKeys = listOfApplyKeysPreFlat.flat();
    }

    public applyKeySyntaxIsOkay(listOfKeys: any): boolean {
        let listOfApplyElements = listOfKeys;
        for (let element of listOfApplyElements) {
            if (Object.keys(element).length === 0) {
                return false;
            } else if (Object.keys(element).length === 1) {
                if (this.checkGrandChildrenKeys(element) === false) {
                    return false;
                } else {
                    continue;
                }
            } else { // There's more than 1 key in the element
                let firstKey = Object.keys(element)[0];
                for (let i = 1; i < Object.keys(element).length; i++) {
                    if (firstKey !== Object.keys(element)[i]) {
                        return false;
                    }
                    if (this.checkGrandChildrenKeys(element) === false) {
                        return false;
                    } else {
                        continue;
                    }
                }
            }
        }
        return true;
    }

    private checkGrandChildrenKeys(element: any): boolean {
        let grandChildrenKey = Object.values(element)[0];
        let listOfGrandChildrenKeys = Object.keys(grandChildrenKey);
        if (listOfGrandChildrenKeys.length === 0) {
            return false;
        } else if (listOfGrandChildrenKeys.length === 1) {
            return true;
        } else { // There's more than 1 key in the element
            let firstKey = listOfGrandChildrenKeys[0];
            for (let i = 1; i < listOfGrandChildrenKeys.length; i++) {
                if (firstKey !== listOfGrandChildrenKeys[i]) {
                    return false;
                }
            }
        }
        return true;
    }
}
