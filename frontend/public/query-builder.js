/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    // ========= DETERMINE COURSES OR ROOMS DOCUMENT ========= //
    let doc;        //  courses or rooms sub document
    let dataType;   // "courses" or "rooms"

    if (document.getElementById('form-container').children[1].attributes[0].value === "tab-panel active") {
        doc      = document.getElementById('form-container').children[1];
        dataType = "courses";
    } else if     (document.getElementById('form-container').children[2].attributes[0].value === "tab-panel active") {
        doc      = document.getElementById('form-container').children[2];
        dataType = "rooms";
    }
    // ================== BUILD THE QUERY ================== //
    query["WHERE"]   = buildWhere   (doc, dataType, false);
    query["OPTIONS"] = buildOptions (doc, dataType);
    if (needTransformation(doc)) {
        query["TRANSFORMATIONS"] = buildTransformations(doc, dataType);
    }
    return query;
};

function buildWhere(doc, dataType, prevNot) {
    let result = {};
    let conditionType;       // "AND" || "OR" || "NOT"
    let listOfConditionTypes = doc.getElementsByClassName('control-group condition-type')[0].children;
    let listOfConditions     = doc.getElementsByClassName('conditions-container')[0].children;
    let firstCondition       = doc.getElementsByClassName('conditions-container')[0].children[0];
    let numConditions        = listOfConditions.length;

    // ================== GET CONDITION TYPE ================== //
    if (prevNot === true) {
        conditionType = "OR";
    } else {
        for (let type of listOfConditionTypes) {
            if (type.children[0].checked) {
                switch (type.children[0].value) {
                    case "all": conditionType  = "AND";
                        break;
                    case "any": conditionType  = "OR";
                        break;
                    case "none": conditionType = "NOT";
                        break;
                }
                break;
            }
        }
    }
    if (numConditions === 0) {
        return {};
    } else if (numConditions === 1) {
        return buildWhereChild(firstCondition, dataType, false);
    } else {
        if (conditionType === "NOT") {
            result["NOT"] = buildWhere(doc, dataType, true);
        } else {
            let childContainer = [];
            for (let condition of listOfConditions) {
                childContainer.push(buildWhereChild(condition, dataType, false));
            }
            result[conditionType] = childContainer;
        }
    }
    return result;
}

function buildWhereChild(c, dataType, prevNot) {
    let result = {};

    let listOfOperators = c.getElementsByClassName('control operators')[0].children[0].children; // [EQ, GT, IS, LS]
    let listOfFields    = c.getElementsByClassName('control fields')[0].children[0].children; // [Average, Department, ...]

    let selectedOperator; // "GT"
    let selectedField;    // "Average"
    let selectedTerm;     // 98 or "AANB"

    let parent;
    let child = {};

    // =========================== NOT CASE =========================== //
    // Ex. "WHERE": { "NOT": {"GT": ... } }
    if (prevNot === false) {
        if (c.getElementsByClassName('control not')[0].children[0].checked === true) {
            result["NOT"] = buildWhereChild(c, dataType, true);
            return result;
        }
    }

    // =========================== BUILD PARENT =========================== //
    // Ex. { "GT": { ... } }
    for (let op of listOfOperators) {
        if (op.selected === true) {
            selectedOperator = op.label; // "EQ" || "GT" || "IS" || "LS"
            break;
        }
    }

    // =========================== BUILD CHILD FIELD =========================== //
    // Ex. { "courses_avg": ... }
    for (let field of listOfFields) {
        if (field.selected === true) {
            selectedField = dataType + "_" + field.value;
            break;
        }
    }
    // =========================== BUILD CHILD VALUE =========================== //
    // Ex. { "...": 98 }
    selectedTerm = c.getElementsByClassName('control term')[0].children[0].value;

    // IS always returns a string
    // string -> IS -> string
    // number -> IS -> string

    // number -> EQ -> number
    // string -> EQ -> string
    if (selectedOperator !== "IS") {
        if (selectedTerm.match("^[-+]?[0-9]+[.]?[0-9]*([eE][-+]?[0-9]+)?$")) {
            selectedTerm = Number(selectedTerm);
        }
    }

    // =========================== AVENGERS ASSEMBLE =========================== //
    parent               = selectedOperator; // "GT"
    child[selectedField] = selectedTerm; // "Average": 98
    result[parent]       = child; // { "GT": { "Average": 98 } }

    return result;
}

function buildOptions(doc, dataType) {
    // GOAL: "OPTIONS": { "COLUMNS": [ "courses_dept", "courses_avg" ], "ORDER": { "dir: UP", keys: [ "courses_avg" ] } }
    let result = {};
    result["COLUMNS"] = buildColumns(doc, dataType);

    let listOfOrderFields = doc.getElementsByClassName('control order fields')[0].children[0].children;
    for (let field of listOfOrderFields) {
        if (field.selected === true) {
            result["ORDER"] = buildOrder(doc, dataType);
            break;
        }
    }

    return result;
}

function buildColumns(doc, dataType) {
    // GOAL: [ "courses_dept", "courses_avg" ]
    let result = [];
    let listOfFields = doc.getElementsByClassName('form-group columns')[0].children[1].children;

    for (let field of listOfFields) {
        if (field.children[0].checked === true) {
            if (field.className === "control field") {
                result.push(dataType + "_" + field.children[0].value);
            } else {
                result.push(field.children[0].value);
            }
        }
    }

    return result;
}

function buildOrder(doc, dataType) {
    // GOAL: { "dir: UP", keys: [ "courses_avg" ] }
    // OR    "courses_avg"
    let result = {};
    let listOfFields = doc.getElementsByClassName('control order fields')[0].children[0].children;
    let direction;
    // ========= GET DIRECTION ========= //
    if (doc.getElementsByClassName('control descending')[0].children[0].checked === true) {
        direction = "DOWN";
    } else {
        direction = "UP";
    }
    // ========= DO C1 ORDER IF NEEDED ========= //
    if (listOfFields.length === 1 && direction === "UP") {
        return dataType + "_" + listOfFields[0].value;
    }
    // ========= ELSE DO C2 ORDER ========= //
    // ==== BUILD KEYS ==== //
    let keys = [];
    for (let field of listOfFields) {
        if (field.selected === true) {
            if (field.className === "transformation") {
                keys.push(field.value);
            } else {
                keys.push(dataType + "_" + field.value);
            }
        }
    }
    // ==== ASSEMBLE C2 ORDER ==== //
    result["dir"] = direction;
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
    let listOfTransformations = doc.getElementsByClassName('transformations-container')[0].children;

    // ========= EMPTY APPLY CASE ========= //
    if (listOfTransformations.length === 0) {
        return [];
    }

    // ========= BUILD APPLY ========= //
    for (let transformation of listOfTransformations) {
        result.push(buildTransformationChild(doc, dataType, transformation));
    }

    return result;
}

function buildTransformationChild(doc, dataType, transformation) {
    // GOAL: { "overallAvg": { "MAX": "courses_avg" } }
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
    let listOfFields    = controlFields.children[0].children;
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
    result[parent] = child;
    return result;
}
