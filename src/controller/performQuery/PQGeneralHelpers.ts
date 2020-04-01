export default class PQGeneralHelpers {
    public static dataSetID: string = "courses"; // "courses" by default, will be changed in establishDataset
    public static dataSetKind: string = "courses"; // "courses" by default, will be changed in establishDataset
    public static listOfAcceptableCoursesFields = [
        "dept", "id", "avg", "instructor", "title", "pass", "fail", "audit", "uuid", "year" ];

    public static listOfAcceptableRoomsFields = [ "fullname", "shortname", "number", "name",
        "address", "lat", "lon", "seats", "type", "furniture", "href" ];

    public static acceptableCoursesStringFields = ["dept", "id", "instructor", "title", "uuid"];
    public static acceptableRoomsStringFields   = ["fullname", "shortname", "number", "name", "address", "type",
        "furniture", "href" ];

    public static acceptableCoursesNumberFields = ["avg", "pass", "fail", "audit", "year"];
    public static acceptableRoomsNumberFields   = ["lat", "lon", "seats"];

    public setDataSetID(value: string) {
        PQGeneralHelpers.dataSetID = value;
    }

    public getDataSetID() {
        return PQGeneralHelpers.dataSetID;
    }

    public keyIsValidColumnUnderscoreItem(key: any): any {
        // Step 1: key must have an _
        if ((key.indexOf("_")) === -1) {
            return "Invalid key " + key + " in COLUMNS. Must have _";
        }

        // Step 2: Check ID of id_field
        let keyID = key.substring(0, key.indexOf("_")); // ex. courses_avg -> courses
        if (keyID !== PQGeneralHelpers.dataSetID) {
            return "COLUMNS cannot reference multiple datasets or dataset not loaded yet";
        }

        // Step 3: Check field of id_field
        let field = key.substring(key.indexOf("_") + 1, key.length); // ex. courses_avg -> avg, rooms_name -> name
        if (PQGeneralHelpers.dataSetKind === "courses") {
            if (!PQGeneralHelpers.listOfAcceptableCoursesFields.includes(field)) {
                return "COLUMNS has an invalid courses field ";
            }
        } else { // PQGeneralHelpers.dataSetKind === "rooms"
            if (!PQGeneralHelpers.listOfAcceptableRoomsFields.includes(field)) {
                return "COLUMNS has an invalid rooms field ";
            }
        }


        return true;
    }

    // private isNameValid(key: any): boolean { // ex. key = rooms_name
    //     let shortname = ;// get the
    //     let number =;
    //     let properRoomsName = shortname + "_" + number;
    //     if (key !== properRoomsName) {
    //         return false;
    //     }
    //     return true;
    // }

    /**
     * Translates query key_value format to JSON value format
     * ex. Query has wants to know "courses_avg", so we have to search
     * each section's "Avg" key.
     */
    public static translate(queryKey: string): string {
        let id = PQGeneralHelpers.dataSetID; // ex. "courses" || "rooms"
        if (PQGeneralHelpers.dataSetKind === "courses") {
            return this.switchForCourses(queryKey, id);
        }
        if (PQGeneralHelpers.dataSetKind === "rooms") {
            return this.switchForRooms(queryKey, id);
        }
    }

    private static switchForCourses(queryKey: string, id: string) {
        switch (queryKey) {
            // STRINGS
            case id.concat("_", "dept"):
                return "Subject";
            case id.concat("_", "id"):
                return "Course";
            case id.concat("_", "instructor"):
                return "Professor";
            case id.concat("_", "title"):
                return "Title";
            case id.concat("_", "uuid"):
                return "id";

            // NUMBERS
            case id.concat("_", "avg"):
                return "Avg";
            case id.concat("_", "pass"):
                return "Pass";
            case id.concat("_", "fail"):
                return "Fail";
            case id.concat("_", "audit"):
                return "Audit";
            case id.concat("_", "year"):
                return "Year";
        }
    }

    private static switchForRooms(queryKey: string, id: string) {
        switch (queryKey) {
            // STRINGS
            case id.concat("_", "fullname"):
                return "fullname";
            case id.concat("_", "shortname"):
                return "shortname";
            case id.concat("_", "number"):
                return "number";
            case id.concat("_", "name"):
                return "name";
            case id.concat("_", "address"):
                return "address";
            case id.concat("_", "type"):
                return "type";
            case id.concat("_", "furniture"):
                return "furniture";
            case id.concat("_", "href"):
                return "href";

            // NUMBERS
            case id.concat("_", "lat"):
                return "lat";
            case id.concat("_", "lon"):
                return "lon";
            case id.concat("_", "seats"):
                return "seats";
        }
    }

}
