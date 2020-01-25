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
    private courses: object[];

    constructor(id: string, kind: InsightDatasetKind, content: string) {
        this.id = id;
        this.kind = kind;
        this.setCourses(content)
            .then((result: any) => {
                // this.filterInvalidSections();
                // this.checkCoursesNotEmpty();
            });
    }

    private setCourses(content: string): Promise<any> {
        let courses: object[] = [];
        const zip = new JSZip();
        const files: Array<Promise<string>> = [];
        return zip.loadAsync(content, {base64: true})
            .then((result: JSZip) => {
                zip.folder("courses").forEach((relativePath, file) => {
                    files.push(file.async("text"));
                    return files;
                });
                return files;
            })
            .then((promises: Array<Promise<string>>) => {
                Promise.all(promises)
                    .then((coursesAsStrings: string[]) => {
                        let isEmpty: boolean = true;
                        for (let course of coursesAsStrings) {
                            courses.push(JSON.parse(course));
                        }
                        this.courses = courses;
                    });
            });
    }

    public getId():
        string {
        return this.id;
    }

    public getKind():
        InsightDatasetKind {
        return this.kind;
    }

    public getNumRows():
        number {
        // TODO: implement
        return 0;
    }


    // private checkCoursesNotEmpty() {
    //     for (let course of this.courses) {
    //         if (course["result"] !== []) {
    //             Promise.resolve();
    //         } else {
    //             Promise.reject("invalid dataset: contains no valid sections");
    //         }
    //     }
    // }

    // private filterInvalidSections() {
    //     for (let course in this.courses) {
    //         for (let section in course["result"]) {
    //             if (!("Subject" in section && "Course" in section && "Avg" in section && "Professor" in section &&
    //                 "Title" in section && "Pass" in section && "Fail" in section && "id" in section &&
    //                 "Year" in section)) {
    //             course["result"].splice(course["result"].indexOf(section));
    //             }
    //         }
    //     }
    // }
}
