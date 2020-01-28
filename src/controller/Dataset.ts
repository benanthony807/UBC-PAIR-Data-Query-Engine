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
import * as JSZip from "jszip";
import Log from "../Util";
import {InsightDatasetKind} from "./IInsightFacade";
import {resolve} from "path";
import Course from "./Course";

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
            if (course["result"] !== []) {
                return Promise.resolve();
            } else {
                return Promise.reject("invalid dataset: contains no valid sections");
            }
        }
    }

    public filterInvalidSections(): Promise<any> {
        for (let course of this.courses) {
            for (let section of course["result"]) {
                if (!this.hasAllRequiredFields(section)) {
                course["result"].splice(course["result"].indexOf(section));
                }
            }
        }
        return Promise.resolve();
    }

    public hasAllRequiredFields(section: object) {
        return  "Subject" in section &&
                "Course" in section &&
                "Avg" in section &&
                "Professor" in section &&
                "Title" in section &&
                "Pass" in section &&
                "Fail" in section &&
                "id" in section &&
                "Year" in section;
    }

    public setCoursesForTesting(courses: Course[]) {
        this.courses = courses;
    }

}
