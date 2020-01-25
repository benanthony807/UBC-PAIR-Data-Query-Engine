import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, } from "./IInsightFacade";
import * as JSZip from "jszip";
import Dataset from "./Dataset";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private datasets: Dataset[];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = [];
    }

    public addDataset(
        id: string,
        content: string,
        kind: InsightDatasetKind,
    ): Promise<string[]> {
        if (this.idValid(id) && kind === InsightDatasetKind.Courses) {
            try {
                let dataset = new Dataset(id, kind, content);
                // this.writeToDisk(id, dataset);
                // this.datasets.push(dataset);
                return Promise.resolve(this.getIds());
            } catch (err) {
                return Promise.reject(err);
            }
        } else {
            return Promise.reject(this.diagnoseIssue(id, content, kind));
        }
    }


    private idValid(id: string): boolean {
        // whitespace check taken from https://stackoverflow.com/questions/2031085/how-can-i-check-if-string-contains-
        // characters-whitespace-not-just-whitespace/2031119
        if (id.includes("_") || /^\s+$/.test(id)) {
            return false;
        }
        for (let ds of this.datasets) {
            if (id === ds.getId()) {
                return false;
            }
        }
        return true;
    }

    private diagnoseIssue(id: string, content: string, kind: InsightDatasetKind): string {
        if (id.includes("_")) {
            return "id invalid: contains underscore";
        } else if (/^\s+$/.test(id)) {
            return "id invalid: contains only whitespace characters";
        } else if (kind !== InsightDatasetKind.Courses) {
            return `kind invalid: ${kind} is not allowed`;
        }
        for (let ds of this.datasets) {
            if (id === ds.getId()) {
                return "dataset invalid: dataset with same id already added";
            }
        }
        return "dataset invalid: contains no valid sections";
    }

    public writeToDisk(id: string, dataset: Dataset) {
        return;
    }

    private getIds(): string[] {
        let ids: string[] = [];
        for (let dataset of this.datasets) {
            ids.push(dataset.getId());
        }
        return ids;
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let insightDatasets: InsightDataset[] = [];
        for (let dataset of this.datasets) {
            const ids: InsightDataset = {
                id: dataset.getId(),
                kind: dataset.getKind(),
                numRows: dataset.getNumRows(),
            };
            insightDatasets.push(ids);
        }
        return Promise.resolve(insightDatasets);
    }
}
