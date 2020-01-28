import {InsightDatasetKind} from "./IInsightFacade";
import Dataset from "./Dataset";
import Course from "./Course";
import * as JSZip from "jszip";

export default class DatasetHelper {

    public idValid(id: string, datasets: Dataset[]): boolean {
        // whitespace check taken from https://stackoverflow.com/questions/2031085/how-can-i-check-if-string-contains-
        // characters-whitespace-not-just-whitespace/2031119
        if (id.includes("_") || /^\s+$/.test(id)) {
            return false;
        }
        for (let ds of datasets) {
            if (id === ds.getId()) {
                return false;
            }
        }
        return true;
    }

    public diagnoseIssue(id: string, kind: InsightDatasetKind, datasets: Dataset[]): string {
        if (id.includes("_")) {
            return "id invalid: contains underscore";
        } else if (/^\s+$/.test(id)) {
            return "id invalid: contains only whitespace characters";
        } else if (kind !== InsightDatasetKind.Courses) {
            return `kind invalid: ${kind} is not allowed`;
        }
        for (let ds of datasets) {
            if (id === ds.getId()) {
                return "dataset invalid: dataset with same id already added";
            }
        }
    }

    public writeToDisk(id: string, dataset: Dataset) {
        // TODO: implement
        return;
    }

    public getIds(datasets: Dataset[]): string[] {
        let ids: string[] = [];
        for (let dataset of datasets) {
            ids.push(dataset.getId());
        }
        return ids;
    }

    public removeFromDisk(id: string) {
        // TODO: implement
        return;
    }

    public readContent(content: string): Promise<any> {
        let courses: Course[] = [];
        const zip = new JSZip();
        const files: Array<Promise<string>> = [];
        return new Promise<any>((resolve, reject) => {
            zip.loadAsync(content, {base64: true})
                .then((result: JSZip) => {
                    try {
                        result.folder("courses").forEach((relativePath, file) => {
                            files.push(file.async("text"));
                            return files;
                        });
                    } catch (err) {
                       reject(err);
                    }
                    return files;
                })
                .then((promises: Array<Promise<string>>) => {
                    Promise.all(promises)
                        .then((coursesAsStrings: string[]) => {
                            for (let course of coursesAsStrings) {
                                try {
                                    courses.push(JSON.parse(course));
                                } catch (err) {
                                    continue;
                                }
                            }
                            resolve(courses as Course[]);
                        });
                });
        });
    }
}
