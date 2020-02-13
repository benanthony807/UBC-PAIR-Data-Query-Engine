import { InsightDatasetKind, InsightError } from "./IInsightFacade";
import Dataset from "./Dataset";
import Course from "./Course";
import * as JSZip from "jszip";
import * as fs from "fs";

export default class DatasetHelper {
    public idValid(id: string): boolean {
        // whitespace check taken from https://stackoverflow.com/questions/2031085/how-can-i-check-if-string-contains-
        // characters-whitespace-not-just-whitespace/2031119
        return id !== null && !(id.includes("_") || /^\s+$/.test(id));
    }

    public idInDatasets(id: string, datasets: Dataset[]): boolean {
        for (let ds of datasets) {
            if (id === ds["id"]) {
                return true;
            }
        }
        let diskDatasets: Dataset[] = this.readDatasets();
        for (let ds of diskDatasets) {
            if (id === ds["id"]) {
                return true;
            }
        }
        return false;
    }

    public diagnoseIssue(
        id: string,
        kind: InsightDatasetKind,
        datasets: Dataset[],
    ): string {
        if (id === null) {
            return "id is null";
        }
        if (id.includes("_")) {
            return "id invalid: contains underscore";
        } else if (/^\s+$/.test(id)) {
            return "id invalid: contains only whitespace characters";
        } else if (kind !== InsightDatasetKind.Courses) {
            return `kind invalid: ${kind} is not allowed`;
        }
        for (let ds of datasets) {
            if (id === ds["id"]) {
                return "dataset invalid: dataset with same id already added";
            }
        }
    }

    // NOTE: if you want to run this on your own machine just change path to your local path,
    // (right click on data, copy path)
    public writeToDisk(datasets: Dataset[]) {
        // writing behaviour taken from https://stackoverflow.com/questions/2496710/writing-files-in-node-js
        // reading behaviour taken from https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options
        let diskDatasets: Dataset[] = this.readDatasets();
        for (let diskDataset of diskDatasets) {
            let diskDatasetSeenOnCache: boolean = false;
            for (let cacheDataset of datasets) {
                if (diskDataset["id"] === cacheDataset["id"]) {
                    diskDatasetSeenOnCache = true;
                    break;
                }
            }
            if (!diskDatasetSeenOnCache) {
                datasets.push(diskDataset);
            }
        }
        this.writeDatasets(datasets);
        // return Promise.resolve();
    }

    public removeFromDisk(id: string) {
        let diskDatasets: Dataset[];
        diskDatasets = this.readDatasets();

        for (let ds of diskDatasets) {
            if (id === ds["id"]) {
                diskDatasets.splice(diskDatasets.indexOf(ds), 1);
                break;
            }
        }
        this.writeDatasets(diskDatasets);
    }

    public readDatasets() {
        try {
            let utf8Dataset: string = fs.readFileSync(
                "data/datesets.txt",
                "utf8",
            );
            return JSON.parse(utf8Dataset) as Dataset[];
        } catch (err) {
            return [] as Dataset[];
        }
    }

    public writeDatasets(diskDatasets: Dataset[]) {
        // use of renameSync + appendFileSync taken from https://stackoverflow.com/questions/5315138/node-js-remove-file
        try {
            fs.renameSync("data/datesets.txt", "data/datesetsbackup.txt");
        } catch (err) {
            //
        }
        fs.appendFileSync("data/datesets.txt", JSON.stringify(diskDatasets));
    }

    public getIds(datasets: Dataset[]): string[] {
        let idsFromCache: string[] = [];
        let idsFromDisk: string[] = [];
        for (let dataset of datasets) {
            idsFromCache.push(dataset["id"]);
        }

        let diskDatasets: Dataset[] = this.readDatasets();
        for (let dataset of diskDatasets) {
            idsFromDisk.push(dataset["id"]);
        }

        if (idsFromDisk.length > idsFromCache.length) {
            return idsFromDisk;
        }
        return idsFromCache;
    }

    public readContent(content: string): Promise<any> {
        let courses: Course[] = [];
        const zip = new JSZip();
        const files: Array<Promise<string>> = [];
        return new Promise<any>((resolve, reject) => {
            try {
                zip.loadAsync(content, { base64: true })
                    .then((result: JSZip) => {
                        result
                            .folder("courses")
                            .forEach((relativePath, file) => {
                                files.push(file.async("text"));
                                return files;
                            });
                        return files;
                    })
                    .then((promises: Array<Promise<string>>) => {
                        Promise.all(promises).then(
                            (coursesAsStrings: string[]) => {
                                for (let course of coursesAsStrings) {
                                    try {
                                        courses.push(JSON.parse(course));
                                    } catch (err) {
                                        //
                                    }
                                }
                                resolve(courses as Course[]);
                            },
                        );
                    })
                    .catch((err: any) => {
                        reject(new InsightError(err));
                    });
            } catch (err) {
                return reject(err);
            }
        });
    }
}
