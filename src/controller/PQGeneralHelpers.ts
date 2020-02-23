export default class PQGeneralHelpers {
    public listOfAcceptableFields: string[];
    public acceptableStringFields: string[];
    public acceptableNumberFields: string[];
    public dataSetID: string = "courses"; // "courses" by default, will be changed in establishDataset
    public static listOfAcceptableFields = [
        "dept",
        "id",
        "avg",
        "instructor",
        "title",
        "pass",
        "fail",
        "audit",
        "uuid",
        "year",
    ];

    public static acceptableStringFields = ["dept", "id", "instructor", "title", "uuid"];
    public static acceptableNumberFields = ["avg", "pass", "fail", "audit", "year"];

    public setDataSetID(value: string) {
        this.dataSetID = value;
    }

    public getDataSetID() {
        return this.dataSetID;
    }

    public keyIsValidColumnUnderscoreItem(key: any): any {
        // Step 1: key must have an _
        if ((key.indexOf("_")) === -1) {
            return "Invalid key " + key + " in COLUMNS. Must have _";
        }

        // Step 2: Check ID of id_field
        let keyID = key.substring(0, key.indexOf("_")); // ex. courses_avg -> courses
        if (keyID !== this.dataSetID) {
            return "COLUMNS cannot reference multiple datasets or dataset not loaded yet";
        }

        // Step 3: Check field of id_field
        let field = key.substring(key.indexOf("_") + 1, key.length); // ex. courses_avg -> avg
        if (!PQGeneralHelpers.listOfAcceptableFields.includes(field)) {
            return "COLUMNS has an invalid key ";
        }

        return true;
    }

}
