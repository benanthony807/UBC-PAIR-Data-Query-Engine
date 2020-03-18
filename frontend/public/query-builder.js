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

    // ========= DETERMINE COURSES OR ROOMS DOCUMENT ========= //
    let doc;
    let dataType;
    if (determineDoc() === "courses") {
        doc = document.getElementById('form-container').children[1];
        dataType = "courses";
    } else {
        doc = document.getElementById('form-container').children[2];
        dataType = "rooms";
    }

    // ========= BUILD THE QUERY =========
    query["WHERE"]   = buildWhere(doc, dataType, false);
    query["OPTIONS"] = buildOptions(doc, dataType);
    if (needTransformation(doc)) {
        query["TRANSFORMATIONS"] = buildTransformations(doc, dataType);
    }

    return query;
};

function determineDoc() {
    // return 0 if courses, return 1 if rooms
    let wholeDoc = document.getElementById('form-container');
    let coursesPanelDiv = wholeDoc.children[1];
    let roomsPanelDiv = wholeDoc.children[2];
    if (coursesPanelDiv.attributes[0].value === "tab-panel active") {
        return "courses";
    } else if (roomsPanelDiv.attributes[0].value === "tab-panel active") {
        return "rooms";
    }
}

function buildWhere(doc, dataType, prevNot) {
    // GOAL: {PARENT: CHILD}
    // CASE 1: 1 CONDITION: AND / OR
    //         {"WHERE":{"IS":{"courses_dept":"cpsc"}}
    // CASE 2: 1 CONDITION: NOT
    //         {"WHERE": {"NOT": {"IS":{"courses_dept":"cpsc"}}}
    // CASE 3: 2 CONDITIONS: AND /OR
    //         {"WHERE": {"AND": [ {"IS":{"courses_dept":"cpsc"}}, {...} ]}}
    //         {"WHERE": {"OR":  [ {"IS":{"courses_dept":"cpsc"}}, {...} ]}}
    // CASE 4: 2 CONDITIONS: NOT
    //         {"WHERE": {"NOT": {"OR": [ {"IS":{"courses_dept":"cpsc"}}, {...} ]}}}
    let result = {};
    let conditionType; // "AND" || "OR" || "NOT"
    let listOfConditionTypes = doc.getElementsByClassName('control-group condition-type')[0].children;
    let listOfConditions = doc.getElementsByClassName('conditions-container')[0].children;
    let firstCondition = doc.getElementsByClassName('conditions-container')[0].children[0];
    let numConditions = listOfConditions.length;

    // ========= GET CONDITION TYPE ========= //
    if (prevNot === true) {
        conditionType = "OR";
    } else {
        for (let type of listOfConditionTypes) {
            if (type.children[0].checked) {
                switch (type.children[0].value) {
                    case "all": conditionType = "AND";
                        break;
                    case "any": conditionType = "OR";
                        break;
                    case "none": conditionType = "NOT";
                        break;
                }
                break;
            }
        }
    }

    switch (numConditions) {
        case 0: return {};
        case 1: if (conditionType === "NOT") {
            result["NOT"] = buildWhereChild(firstCondition, dataType);
            } else {
                return buildWhereChild(firstCondition, dataType);
            }
            break;
        case 2: if (conditionType === "NOT") {
            result["NOT"] = buildWhere(doc, dataType, true);
        } else {
            for (let condition of listOfConditions) {
                result[conditionType] = buildWhereChild(condition, dataType);
            }
        }
            break;
    }

    return result;
}

function buildWhereChild(c, dataType) {
    let result = {};

    let listOfOperators = c.getElementsByClassName('control operators')[0].children[0].children; // [EQ, GT, IS, LS]
    let listOfFields    = c.getElementsByClassName('control fields')[0].children[0].children; // [Average, Department, ...]

    let selectedOperator; // "GT"
    let selectedField; // "Average"
    let selectedTerm; // 98 or "AANB"

    let parent;
    let child = {};

    // ========= NOT CASE ========= //
    // Ex. "WHERE": { "NOT": {"GT": ... } }
    if (c.getElementsByClassName('control not')[0].children[0].checked === true) {
        result["NOT"] = buildWhereChild(c);
        return result;
    }

    // ========= BUILD PARENT ========= //
    // Ex. { "GT": { ... } }
    for (let op of listOfOperators) {
        if (op.selected === true) {
            selectedOperator = op.label; // "EQ" || "GT" || "IS" || "LS"
            break;
        }
    }

    // ========= BUILD CHILD ========= // (child should be an object)
    // GET FIELD: Ex. { "courses_avg": ... }
    for (let field of listOfFields) {
        if (field.selected === true) {
            selectedField = dataType + "_" + field.value;
        }
    }
    // GET VALUE: Ex. { "...": 98 }
    selectedTerm = c.getElementsByClassName('control term')[0].children[0].value;

    // ========= AVENGERS ASSEMBLE ========= //
    parent = selectedOperator; // "GT"
    child[selectedField] = selectedTerm; // "Average": 98
    result[parent] = child; // { "GT": { "Average: 98 } }

    return result;
}
//
function buildOptions(doc, dataType) {
    // GOAL: "OPTIONS": { "COLUMNS": [ "courses_dept", "courses_avg" ], "ORDER": { "dir: UP", keys: [ "courses_avg" ] } }
    let result = {};
    result["COLUMNS"] = buildColumns(doc, dataType);
    result["ORDER"] = buildOrder(doc, dataType);
    return result;
}

function buildColumns(doc, dataType) {
    // GOAL: [ "courses_dept", "courses_avg" ]
    let result = [];
    let listOfFields = doc.getElementsByClassName('form-group columns')[0].children[1].children;

    for (let field of listOfFields) {
        if (field.children[0].checked === true) {
            result.push(dataType + "_" + field.children[0].value);
        }
    }

    return result;
}

function buildOrder(doc, dataType) {
    // GOAL: { "dir: UP", keys: [ "courses_avg" ] }
    let result = {};

    // ========= BUILD DIR ========= //
    let direction;
    if (doc.getElementsByClassName('control descending')[0].children[0].checked === true) {
        direction = "DOWN";
    } else {
        direction = "UP";
    }
    result["dir"] = direction;

    // ========= BUILD KEYS ========= //
    let keys = [];
    let listOfFields = doc.getElementsByClassName('control order fields')[0].children[0].children;
    for (let field of listOfFields) {
        if (field.selected === true) {
            keys.push(dataType + "_" + field.value);
        }
    }
    result["keys"] = keys;

    return result;
}

function needTransformation(doc) {
// TRANSFORMATIONS present if anyone in Groups is checked or if Transformations has at least 1 entry
    let listOfGroupFields = doc.getElementsByClassName('form-group groups')[0].children[1].children;

    // Step 1: Group check
    for (let field of listOfGroupFields) {
        if (field.children[0].checked === true) {
            return true;
        }
    }

    // Step 2: Transformations check
    return doc.getElementsByClassName('transformations-container')[0].childElementCount > 0;
}

function buildTransformations(doc, dataType) {
    //GOAL: { "GROUP": [ "courses_title" ],
    //        "APPLY": [ { "overallAvg": { "MAX": "courses_avg" } } ] } }
    let result = {};

    result["GROUP"] = buildGroup(doc, dataType);
    result["APPLY"] = buildApply(doc, dataType);

    return result;
}

function buildGroup(doc, dataType) {
    //GOAL: "GROUP": [ "courses_title" ]
    let result = [];

    let listOfGroupFields = doc.getElementsByClassName('form-group groups')[0].children[1].children;
    for (let field of listOfGroupFields) {
        if (field.children[0].checked === true) {
            result.push(dataType + "_" + field.children[0].value)
        }
    }

    return result;
}

function buildApply(doc, dataType) {
    // GOAL: "APPLY": [ { "overallAvg": { "MAX": "courses_avg" } }, {"hello": { "MIN": "courses_fail"} }, ... ]
    let result = [];

    // =========EMPTY APPLY CASE========= //
    if (doc.getElementsByClassName('transformations-container')[0].childElementCount === 0) {
        return [];
    }

    // =========BUILD APPLY========= //
    let listOfTransformations = doc.getElementsByClassName('transformations-container')[0].children;
    for (let transformation of listOfTransformations) {
        result.push(buildTransformationChild(doc, dataType, transformation));
    }

    return result;
}

function buildTransformationChild(doc, dataType, transformation) {
    // GOAL: { "overallAvg": { "MAX": "courses_avg" } }
    // transformation is <div class="control-group transformation">...</div>
    let result = {};

    let controlTerm = transformation.children[0];
    let controlOperators = transformation.children[1];
    let controlFields = transformation.children[2];

    let parent = controlTerm.children[0].value;
    result[parent] = buildTransformationGrandchild(doc, dataType, controlOperators, controlFields);

    return result;
}

function buildTransformationGrandchild(doc, dataType, controlOperators, controlFields) {
    // GOAL: { "MAX": "courses_avg" }
    let result = {};

    let parent;
    let child;
    let listOfOperators = controlOperators.children[0].children;
    let listOfFields = controlFields.children[0].children;

    for (let operator of listOfOperators) {
        if (operator.selected === true) {
            parent = operator.value;
            break;
        }
    }

    for (let field of listOfFields) {
        if (field.selected === true) {
            child = dataType + "_" + field.value;
            break;
        }
    }

    return result;
}


