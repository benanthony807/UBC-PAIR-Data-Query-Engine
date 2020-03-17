/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 *
 * NOTES:
 * 1.   The UI will only be able to build a subset of all possible queries.
 *      Several complex structures (e.g. nesting) are not possible and this
 *      is intended.
 * 2.   If no conditions are specified, the query will no conditions
 * 3.   If only one condition is specified, no longic connector (and/or)
 *      should be used. Only the single condition should be used
 * 4.   You can select multiple items for columns and order in the UI.
 *      This is typically done using Ctrl+Click on Windows
 * 5.   The order of the keys in the order section is ignored and will not
 *      be tested by Autobot.
 * 6.   If the sort is ascending with a single key, C1 or C2 sort can be used
 * 7.   As there is no location to specify a dataset id, you can ASSUME that
 *      the id will be either courses or rooms as appropriate
 */

/**
 * Briefing: The UI will have checkboxes and stuff and the DOM reflects what the
 * user selects.
 * Goal: Go into the DOM, look at what's selected, build a query (Remember: it's an object)
 * Step 1: Access the DOM
 * Step 2: Create the object
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    // Set up the doc to use
    let wholeDoc = document.getElementById('form-container');
    let doc;
    let coursesPanelDiv = wholeDoc.children[1];
    let roomsPanelDiv = wholeDoc.children[2];
    if (coursesPanelDiv.attributes[0].value === "tab-panel active") {
        doc = coursesPanelDiv;
    } else if (roomsPanelDiv.attributes[0].value === "tab-panel active") {
        doc = roomsPanelDiv;
    }

    // Set up the DOM variables
    // let formDataType = doc.children[0];
    //     let divClassFormGroupConditions      = formDataType.children[0];
    //     let divClassFormGroupColumns         = formDataType.children[1];
    //     let divClassFormGroupOrder           = formDataType.children[2];
    //     let divClassFormGroupGroups          = formDataType.children[3];
    //     let divClassFormGroupTransformations = formDataType.children[4];

    query["WHERE"]   = buildWhere(doc);
    query["OPTIONS"] = buildOPTIONS();

    // TRANSFORMATIONS is present if anyone in Groups is checked or if
    // Transformations has at least 1 entry
    if (needTransformation(divClassFormGroupGroups, divClassFormGroupTransformations) === true) {
        query["TRANSFORMATIONS"] = buildTransformations(divClassFormGroupGroups, divClassFormGroupTransformations);
    }
    //
};

buildWhere = function (doc) {
    // ("WHERE": {PARENT: CHILD} )
    let result = {};

    // let controlGroupConditionType = conditions.children[1];
    // let conditionsContainer = conditions.children[2];

    // If no child, then we're just doing an empty WHERE
    if (conditionsContainer.children.length === 0 ) {
        return result; // ("WHERE": {} ... )
    }

    // ========= BUILD PARENT ========= //
    // Else there is a child and we set up the filter
    // let controlConditionsAllRadio  = controlGroupConditionType.children[0];
    // let controlConditionsAnyRadio  = controlGroupConditionType.children[1];
    // let controlConditionsNoneRadio = controlGroupConditionType.children[2];
    let parent; // Parent is AND || OR || NOT

    if (doc.getElementById('courses-conditiontype-all').checked === true) {
        parent = "AND";
    } else if (doc.getElementById('courses-conditiontype-any').checked  === true) {
        parent = "OR";
    } else if (doc.getElementById('courses-conditiontype-none').checked === true) {
        parent = "NOT";
    }

    // ========= BUILD CHILD ========= //
    let child = whereChildBuilder(doc);

    // ========= ASSEMBLE ========= //
    // Note: whereChildBuilder() returns object
    // ("WHERE": {"AND": [ whereChildBuilder() ] } )
    // ("WHERE": {"NOT": whereChildBuilder() } )
    if (parent === "AND" || parent === "OR") {
        child = [];
        child.append(whereChildBuilder(doc));
    }
    result[parent] = child;
    return result;
};

// RETURN OBJECT
/**
 * Ex. Caller has: ("WHERE": {"AND": [    ...    ] } )
 * So we need to build the child for "AND":
 * Ex. {"GT": { "courses_avg": 97 } }
 */

whereChildBuilder = function (doc) {
    let result = {};

    // let controlNot       = container.children[0].children[0];
    // let controlFields    = container.children[0].children[1];
    // let controlOperators = container.children[0].children[2];
    // let controlTerm      = container.children[0].children[3];

    let listOfOperators = controlOperators.children[0].children; // [EQ, GT, IS, LS]
    let listOfFields    = controlFields.children[0].children; // [Average, Department, ...]

    let selectedOperator; // "GT"
    let selectedField; // "Average"
    let selectedTerm; // 98 or "AANB"

    let parent;
    let child = {};

    // ========= NOT case ========= //
    // Ex. "WHERE": { "NOT": {"GT": ... } }
    if (controlNot.children[0].children[0].checked === true) {
        result["NOT"] = whereChildBuilder(container);
        return result;
    }

    // ========= BUILD PARENT ========= //
    // Ex. { "GT": { ... } }
    for (let op of listOfOperators) {
        if (op.selected === true) {
            selectedOperator = op.label // "EQ" || "GT" || "IS" || "LS"
        }
    }

    // ========= BUILD CHILD ========= // (child should be an object)
    // GET FIELD
    // Ex. { "courses_avg": ... }
    for (let field of listOfFields) {
        if (field.selected === true) {
            if (document.getElementById('form-container').children[1].attributes[0].value
                === "tab-panel active") {
                selectedField = "courses_" + field.value;
            } else if (document.getElementById('form-container').children[2].attributes[0].value
                === "tab-panel active") {
                selectedField = "rooms_" + field.value;
            }
        }
    }
    // GET VALUE
    // Ex. { "...": 98 }
    selectedTerm = controlTerm.children[0].value;

    // ========= ASSEMBLE ========= //
    parent = selectedOperator;
    child[selectedField] = selectedTerm; // "Average": 98
    result[parent] = child;

    return result;
};

// Sever.ts
// that.rest.post("/query", (req: restify.Request, res: restify.Response, next: restify.Next) => {
//     // I'm just guessing req.body contains the query but that's a huge guess
//     let query: any = req.body;

//{
//     "WHERE": {
//         "GT": {
//             "courses_avg": 97
//         }
//     },
//     "OPTIONS": {
//         "COLUMNS": [
//             "courses_dept",
//             "courses_avg"
//         ],
//         "ORDER": "courses_avg"
//     }
// }
