import Log from "../Util";

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

    public doApply(groupedSections: any, query: any): any {
        return false;
    }
}
