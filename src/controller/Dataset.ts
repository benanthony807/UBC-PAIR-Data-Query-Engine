// * a Dataset is an object with 2 member vars, id and courses
// id is a string, the id of the dataset (pretty sure that's just the file name)
// kind is an InsightDatasetKind, the kind of the dataset
// courses is an array of course objects, a course is just how the course it set up in the json
// courses have 2 member vars, "result" and "rank"
// "result" is an array of section objects, already formatted in the json
// "rank" is a number, unsure what it does*/

// * addDataset should
// 1. check to see if the id is valid
//      - does it have an _ or is only whitespace
//      - does a dataset with the same id already exist
// 1.a make sure dataset kind is Courses
// 1.b unzip the dataset with jszip
// 2. check to see if the dataset has at least one valid section
//      - I believe we just skip over any incorrectly formatted sections, so there will have to be some check
//        to ensure proper formatting
// 2.a make content into a dataset object
// 3. write the dataset to disk somewhere
// 4. add that dataset to the array of other datasets in memory


// 5. look through the array of datasets, return an array of strings with their ids*/
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import Course from "./Course";
import Log from "../Util";

export default class Dataset {

    private id: string;
    private kind: InsightDatasetKind;
    private courses: Course[];

    constructor(id: string, kind: InsightDatasetKind, courses: Course[]) {
        let that = this;
        that.id = id;
        that.kind = kind;
        that.courses = courses;
    }

    public getId():
        string {
        return this.id;
    }

    public getKind():
        InsightDatasetKind {
        return this.kind;
    }

    public getNumRows(): number {
        let count: number = 0;
        for (let course of this.courses) {
            for (let section of course["result"]) {
                count++;
            }
        }
        return count;
    }

    public getCourses(): Course[] {
        return this.courses;
    }


    public checkCoursesNotEmpty() {
        for (let course of this.courses) {
            if (course["result"].length > 0) {
                return Promise.resolve(this);
            }
        }
        return Promise.reject(new InsightError("invalid dataset: contains no valid sections"));
    }

    public filterInvalidSections(): Promise<Dataset> {
        for (let course of this.courses) {
            for (let section of course["result"]) {
                section = this.formatFields(section);
                if (!this.hasAllRequiredFields(section) || !this.propertiesHaveCorrectTypes(section)) {
                    course["result"].splice(course["result"].indexOf(section), 1);
                }
            }
        }
        return Promise.resolve(this);
    }

    public hasAllRequiredFields(section: object) {
        return "Subject" in section &&
            "Course" in section &&
            "Avg" in section &&
            "Professor" in section &&
            "Title" in section &&
            "Pass" in section &&
            "Fail" in section &&
            "Audit" in section &&
            "id" in section &&
            "Year" in section;
    }

    public propertiesHaveCorrectTypes(section: object) {
        return typeof "Subject" === "string" &&
            typeof "Course" === "string" &&
            typeof "Avg" === "number" &&
            typeof "Professor" === "string" &&
            typeof "Title" === "string" &&
            typeof "Pass" === "number" &&
            typeof "Fail" === "number" &&
            typeof "Audit" === "number" &&
            typeof "id" === "string" &&
            typeof "year" === "number";
    }

    public formatFields(section: {[index: string]: any}): object {
        if (section.hasOwnProperty("year")) {
            let yearString: string =  section["year"];
            section["year"] = parseInt(yearString, 10);
        }
        if (section.hasOwnProperty("id")) {
            let idNumber: number = section["id"];
            section["id"] = idNumber.toString(10);
        }
        if (section["Section"] === "overall") {
            section["Year"] = 1900;
        }
        return section;
        // if section is overall set year to 1900
        // set all years to be numbers
        // set all ids to be strings
    }
}

// todo: test format fields
// todo: test propertiesHaveCorrectTypes
// todo: test writeToDisk
// todo: test removeFromDisk

