import {InsightDatasetKind} from "./IInsightFacade";
import Dataset from "./Dataset";
import Course from "./Course";
import * as JSZip from "jszip";
import * as fs from "fs";
import Log from "../Util";

export default class DatasetHelper {

    public idValid(id: string): boolean {
        // whitespace check taken from https://stackoverflow.com/questions/2031085/how-can-i-check-if-string-contains-
        // characters-whitespace-not-just-whitespace/2031119
        return !(id.includes("_") || /^\s+$/.test(id));
    }

    public idInDatasets(id: string, datasets: Dataset[]): boolean {
        for (let ds of datasets) {
            if (id === ds.getId()) {
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

    // NOTE: if you want to run this on your own machine just change path to your local path,
    // (right click on data, copy path)
    public writeToDisk(datasets: Dataset[]): Promise<any> {
        // writing behaviour taken from https://stackoverflow.com/questions/2496710/writing-files-in-node-js
        // reading behaviour taken from https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options
        let diskDatasets: Dataset[] = this.readDatasets();
        for (let diskDataset of diskDatasets) {
            let diskDatasetSeenOnCache: boolean = false;
            for (let cacheDataset of datasets) {
                if (diskDataset.getId() === cacheDataset.getId()) {
                    diskDatasetSeenOnCache = true;
                    break;
                }
            }
            if (!diskDatasetSeenOnCache) {
                datasets.push(diskDataset);
            }
        }
        this.writeDatasets(datasets);
        return Promise.resolve();
    }

    //     let diskDatasets: Dataset[] = this.readDatasets();
    //     for (let diskDataset of diskDatasets) {
    //         let diskDatasetSeenOnCache: boolean = false;
    //         for (let cacheDataset of datasets) {
    //             if (diskDataset.getId() === cacheDataset.getId()) {
    //                 diskDatasetSeenOnCache = true;
    //                 break;
    //             }
    //         }
    //         if (!diskDatasetSeenOnCache) {
    //             datasets.push(diskDataset);
    //         }
    //     }
    //     this.writeDatasets(datasets);
    //     return Promise.resolve();
    // }

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
        return Promise.resolve();
    }

    private readDatasets() {
        try {
            let utf8Dataset: string = fs.readFileSync
            ("data/datasets", "utf8");
            return JSON.parse(utf8Dataset) as Dataset[];
        } catch (err) {
            return [] as Dataset[];
        }
    }

    private writeDatasets(diskDatasets: Dataset[]) {
        try {
            fs.truncateSync("data/datasets", 0);
        } catch (err) {
            //
        }
        fs.writeFile("data/datasets", JSON.stringify(diskDatasets),
            function (err: any) {
                if (err) {
                    return Promise.reject(err);
                }
            });
    }

    public getIds(datasets: Dataset[]): string[] {
        let idsFromCache: string[] = [];
        let idsFromDisk: string[] = [];
        for (let dataset of datasets) {
            idsFromCache.push(dataset.getId());
        }

        let diskDatasets: Dataset[] = this.readDatasets();
        for (let dataset of diskDatasets) {
            idsFromDisk.push(dataset.getId());
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
                zip.loadAsync(content, {base64: true})
                    .then((result: JSZip) => {
                        result.folder("courses").forEach((relativePath, file) => {
                            files.push(file.async("text"));
                            return files;
                        });
                        return files;
                    })
                    .then((promises: Array<Promise<string>>) => {
                        Promise.all(promises)
                            .then((coursesAsStrings: string[]) => {
                                for (let course of coursesAsStrings) {
                                    try {
                                        courses.push(JSON.parse(course));
                                    } catch (err) {
                                        //
                                    }
                                }
                                resolve(courses as Course[]);
                            });
                    });
            } catch (err) {
                return reject(err);
            }
        });
    }
}
