import { InsightDatasetKind, InsightError } from "./IInsightFacade";
import Course from "./Course";
import Room from "./Room";

export default class Dataset {
    private id: string;
    private kind: InsightDatasetKind;
    private data: any[];
    // private rooms: Room[];

    constructor(id: string, kind: InsightDatasetKind, data: any[]) {
        let that = this;
        that.id = id;
        that.kind = kind;
        that.data = data;
    }

    public getId(): string {
        return this.id;
    }

    public getKind(): InsightDatasetKind {
        return this.kind;
    }

    public getNumRows(): number {
        let count: number = 0;
        for (let course of this.data) {
            for (let section of course["result"]) {
                count++;
            }
        }
        return count;
    }

    public getCourses(): Course[] {
        return this.data;
    }

    public checkCoursesNotEmpty() {
        for (let course of this.data) {
            if (course["result"].length > 0) {
                return Promise.resolve(this);
            }
        }
        return Promise.reject(
            new InsightError("invalid dataset: contains no valid sections"),
        );
    }

    public filterInvalidSections() {
        for (let course of this.data) {
            for (let section of course["result"]) {
                section = this.formatFields(section);
                if (
                    !this.hasAllRequiredFields(section) ||
                    !this.propertiesHaveCorrectTypes(section)
                ) {
                    course["result"].splice(
                        course["result"].indexOf(section),
                        1,
                    );
                }
            }
        }
    }

    public hasAllRequiredFields(section: object): boolean {
        return (
            section.hasOwnProperty("Subject") &&
            section.hasOwnProperty("Course") &&
            section.hasOwnProperty("Avg") &&
            section.hasOwnProperty("Professor") &&
            section.hasOwnProperty("Title") &&
            section.hasOwnProperty("Pass") &&
            section.hasOwnProperty("Fail") &&
            section.hasOwnProperty("Audit") &&
            section.hasOwnProperty("id") &&
            section.hasOwnProperty("Year")
        );
    }

    public propertiesHaveCorrectTypes(section: any): boolean {
        return (
            typeof section["Subject"] === "string" &&
            typeof section["Course"] === "string" &&
            typeof section["Avg"] === "number" &&
            typeof section["Professor"] === "string" &&
            typeof section["Title"] === "string" &&
            typeof section["Pass"] === "number" &&
            typeof section["Fail"] === "number" &&
            typeof section["Audit"] === "number" &&
            typeof section["id"] === "string" &&
            typeof section["Year"] === "number"
        );
    }

    public formatFields(section: { [index: string]: any }): any {
        if (section.hasOwnProperty("Year")) {
            let yearString: string = section["Year"];
            section["Year"] = parseInt(yearString, 10);
        }
        if (section.hasOwnProperty("id")) {
            let idNumber: number = section["id"];
            section["id"] = idNumber.toString(10);
        }
        if (section["Section"] === "overall") {
            section["Year"] = 1900;
        }
        return section;
    }
}
