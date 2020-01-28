import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import Dataset from "./Dataset";
import DatasetHelper from "./DatasetHelper";
import Course from "./Course";

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
            return this.datasetHelper.readContent(content)
                .catch((err: any) => {
                    return Promise.reject(new InsightError(err));
                })
                .then((courses: Course[]) => {
                    return new Dataset(id, kind, courses);
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
                    this.datasetHelper.writeToDisk(id, dataset);
                    return dataset;
                })
                .then((dataset: Dataset) => {
                    this.datasets.push(dataset);
                    return Promise.resolve(this.datasetHelper.getIds(this.datasets));
                });
        } else {
            return Promise.reject(new InsightError(this.datasetHelper.diagnoseIssue(id, kind, this.datasets)));
        }
    }

    public removeDataset(id: string): Promise<string> {
        if (this.datasetHelper.idValid(id, this.datasets)) {
            for (let dataset of this.datasets) {
                if (dataset.getId() === id) {
                    this.datasets.splice(this.datasets.indexOf(dataset));
                    this.datasetHelper.removeFromDisk(id);
                    return Promise.resolve(id);
                }
            }
            return Promise.reject(new NotFoundError());
        }
        return Promise.reject
        (new InsightError(this.datasetHelper.diagnoseIssue(id, InsightDatasetKind.Courses, this.datasets)));
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let insightDatasets: InsightDataset[] = [];
        for (let dataset of this.datasets) {
            const insightDataset: InsightDataset = {
                id: dataset.getId(),
                kind: dataset.getKind(),
                numRows: dataset.getNumRows(),
            };
            insightDatasets.push(insightDataset);
        }
        return Promise.resolve(insightDatasets);
    }
}
