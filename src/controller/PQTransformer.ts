import Log from "../Util";
import Decimal from "decimal.js";

export default class PQTransformer {

    public doTransformation(filteredResults: any, query: any): any {
        let resultGroup: any = this.doGroup(filteredResults, query);
        if (typeof resultGroup === "string") {
            return resultGroup;
        }
        return this.doApply(resultGroup, query); // doApply returns either a string or a list of Applied results
    }

    /**
     * Use Map object to retain order
     * Step 0: set up variables:
     * Set up the map
     * Set up the list of GROUP keys
     * Set up the list of groupedItems (the result to return)
     *
     * FOR LOOP START =======================
     * Step 1: get a section
     * Step 2: get the section's "courses_title" value, which is 310 or 210
     * Step 3: see if the map already has the value
     * Step 4a: if not
     * Step4a1: put the section in a list: S1-> [S1] (because for a map it's key:[items]
     * Step4a2: set the map value and list of sections: map.set(value, section) -> (310: [S1])
     * Step 4b: if so
     * Step 4b1 get the list of sections associated with that value
     * Step 4b2 add the current section to that list of sections
     * Step 4b3 set the map value and list of sections
     * FOR LOOP END =======================
     *
     * Step 5: For each key:value in the map = [ [310: [S1, S2, S3]], [210: [S4, S5, S6]] ]
     * put the value in the list of groupedItems
     */
    public doGroup(sections: any, query: any) {
        let group = query["TRANSFORMATIONS"]["GROUP"];
        let groupedSections: any[] = [];
        let map = new Map();
        let lengthOfSections = sections.length;

        for (let i = 0; i < lengthOfSections; i++) {
            let section = sections[i];
            let mapKey: string;
            let listOfMapKeys: any = [];
            for (let key of group) { // "courses_title"
                mapKey = (section[key]); // "310"
                listOfMapKeys.push(mapKey); // ["310", "Jean"]
            }
            listOfMapKeys = JSON.stringify(listOfMapKeys);
            if (!map.has(listOfMapKeys)) { // if map does not have "310" key
                let listifySection = [];
                listifySection.push(section);
                map.set(listOfMapKeys, listifySection); // [310: [S1] ]
            } else { // map already has "310" key
                let currMapValues = map.get(listOfMapKeys); // [310: [S1] ] -> [S1]
                currMapValues.push(section); // [S1, S2]
                map.set(listOfMapKeys, currMapValues); // [310: [S1, S2] ]
            }
        }
        /**
         * At this point: ex map = [ [310: [S1, S2] ], [ 210: [S3, S4] ] ]
         * The values() method returns a new Iterator object that contains
         * the values for each element in the Map object in insertion order.
         * map1.set('1': 'hello')
         * map1.set('2': 'hi')
         * let iterator = map1.values();
         * iterator1.next().value // 'hello'
         * iterator1.next().value // 'hi'
         */

        let iterator = map.values();
        let numOfMapKeys = map.size;
        for (let i = 0; i < numOfMapKeys; i++) {
            groupedSections.push(iterator.next().value);
        }
        return groupedSections; // ex map = [ [S1, S2] [S3, S4] ]
    }

    /**
     * Note: Based on campus explorer, only the first item in GROUP is considered
     * Step 1: get values to make the object with
     * AppliedResult:
     * [ { courses_title : "310", overallAvg: 87.5, overallMax: 95},
     * { courses_title : "210", overallAvg: 77.25, overallMax: 85}, ]
     * appliedResult.push(object)
     * let object = { (1a) courses_title: (1b) "310", (2a) overallAvg: (2b) 87.5, (3a) overallMax: (3b) 95 }
     * (1a): Object.keys(query["TRANSFORMATIONS"]["GROUP"])[0] // "courses_title"
     * (1b): groupedSections[0] ...
     * (2a): childKey
     * (2b): result of cases
     * (3a): do the same for 2a and 2b in the for loop.
     */
    public doApply(groupedSections: any, query: any): any {
        let appliedResult: any = [];
        let group: any = query["TRANSFORMATIONS"]["GROUP"];

        // Num of objects in the result list is based on num of items in groupedList
        // Num of keys:values in the object is based on the number of items in GROUP and APPLY
        // Log.trace("Number of keys in grouped list: " + Object.keys(groupedSections).length);
        let numSections = Object.keys(groupedSections).length;
        for (let i = 0; i < numSections; i++) {
            let objectVessel: any = {};

            // Step 1:  Make the key:value pairs in GROUP and add to the object
            let groupedSection = groupedSections[i]; // [S1, S2] or [S3 S4 S5] or [S6]
            let numGroupKeys: number = group.length;
            // Step 1a: For every key in GROUP, get the key
            for (let k = 0; k < numGroupKeys; k++) {
                let key: any = group[k]; // "courses_title"
                let numSectionsinGroupedSection = groupedSection.length;
                // Step 1b: For every section in groupedSection, get the value
                for (let l = 0; l < numSectionsinGroupedSection; l++) {
                    let section = groupedSection[l]; // S1
                    let value: any = section[key]; // 310
                    // Log.trace("Adding the following key:value: " + key + ":" + value);
                    objectVessel[key] = value;
                }
            }

            // Step 2: Make the key:value pairs in APPLY and add to the object
            let applyKeys = query["TRANSFORMATIONS"]["APPLY"]; // [ { overallAvg: {AVG: "courses_avg"} } ]
            let applyKeysLength = applyKeys.length;
            for (let j = 0; j < applyKeysLength; j++) {
                let childKey = Object.keys(applyKeys[j])[0]; // "overallAvg"
                let grandchild = Object.values(applyKeys[j])[0]; // {AVG: "courses_avg"}
                let grandchildKey = Object.keys(grandchild)[0]; // "AVG"
                let grandchildValue = Object.values(grandchild)[0]; // "courses_avg"
                let processedValue: any;
                switch (grandchildKey) {
                    case "AVG": {
                        processedValue = this.doAvg(grandchildValue, groupedSection);
                        break;
                    }
                    case "MAX": {
                        processedValue = this.doMax(grandchildValue, groupedSection);
                        break;
                    }
                    case "MIN": {
                        processedValue = this.doMin(grandchildValue, groupedSection);
                        break;
                    }
                    case "SUM": {
                        processedValue = this.doSum(grandchildValue, groupedSection);
                        break;
                    }
                    case "COUNT": {
                        processedValue = this.doCount(grandchildValue, groupedSection);
                        break;
                    }
                }
                // Add the key:value into the object
                objectVessel[childKey] = processedValue;
            }
            // Add the object into the result list
            appliedResult.push(objectVessel);
        }
        // return the list
        return appliedResult;
    }

    // [S1, S2, S3, S4]
    public doAvg(key: any, groupedSection: any): number {
        let total: Decimal = new Decimal(0);
        let numRows = 0;
        let groupLength = groupedSection.length;
        for (let i = 0; i < groupLength; i++) {
            let section = groupedSection[i];
            let numToAddPreDec = section[key];
            let numToAdd = new Decimal(numToAddPreDec);
            total = Decimal.add(total, numToAdd);
            numRows ++;
        }
        let avg = total.toNumber() / numRows;
        let result = Number(avg.toFixed(2));
        // Log.trace(result);
        return result;
    }

    public doMax(key: any, sectionGroup: any): number {
        let currMax: number = sectionGroup[0][key];
        let groupLength = sectionGroup.length;
        for (let i = 0; i < groupLength; i++) {
            let section = sectionGroup[i];
            if (currMax < section[key]) {
                currMax = section[key];
            }
        }
        return currMax;
    }

    public doMin(key: any, sectionGroup: any): number {
        let currMin: number = sectionGroup[0][key];
        let groupLength = sectionGroup.length;
        for (let i = 0; i < groupLength; i++) {
            let section = sectionGroup[i];
            if (currMin > section[key]) {
                currMin = section[key];
            }
        }
        return currMin;
    }

    public doSum(key: any, sectionGroup: any): number {
        let currSum: number = 0;
        let groupLength = sectionGroup.length;
        for (let i = 0; i < groupLength; i++) {
            let section = sectionGroup[i];
            currSum += section[key];
        }
        return Number(currSum.toFixed(2));
    }

    /**
     * Count the number of unique occurrences of a field. For both numeric and string fields
     */
    public doCount(key: any, sectionGroup: any): number {
        let uniqueFields: any[] = [];
        let groupLength = sectionGroup.length;
        for (let i = 0; i < groupLength; i++) {
            let section = sectionGroup[i];
            if (!uniqueFields.includes(section[key])) {
                uniqueFields.push(section[key]);
            }
        }
        return uniqueFields.length;
    }

}
