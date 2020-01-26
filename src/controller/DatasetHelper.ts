import {InsightDatasetKind} from "./IInsightFacade";
import Dataset from "./Dataset";

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

    public writeToDisk(id: string, dataset: Dataset, datasets: Dataset[]) {
        return;
    }

    public getIds(datasets: Dataset[]): string[] {
        let ids: string[] = [];
        for (let dataset of datasets) {
            ids.push(dataset.getId());
        }
        return ids;
    }
}
