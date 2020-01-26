import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import * as JSZip from "jszip";
import Dataset from "./Dataset";
import DatasetHelper from "./DatasetHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private datasets: Dataset[];
    private datasetHelper: DatasetHelper;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = [];
        this.datasetHelper = new DatasetHelper();
    }

    public addDataset(
        id: string,
        content: string,
        kind: InsightDatasetKind,
    ): Promise<string[]> {
        if (this.datasetHelper.idValid(id, this.datasets) && kind === InsightDatasetKind.Courses) {
            new Promise((resolve, reject) => {
                return new Dataset(id, kind, content);
            })
                .then((dataset: Dataset) => {
                    dataset.filterInvalidSections();
                    return dataset;
                })
                .then((dataset: Dataset) => {
                    dataset.checkCoursesNotEmpty();
                    return dataset;
                })
                .catch((err: any) => {
                    return Promise.reject(err);
                })
                .then((dataset: Dataset) => {
                    // this.writeToDisk(id, dataset);
                    return dataset;
                })
                .then((dataset: Dataset) => {
                    this.datasets.push(dataset);
                    return Promise.resolve(this.datasetHelper.getIds(this.datasets));
                });
        } else {
            return Promise.reject(this.datasetHelper.diagnoseIssue(id, kind, this.datasets));
        }
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
