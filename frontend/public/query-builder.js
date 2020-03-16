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
CampusExplorer.buildQuery = function() {
    let query = {};
    // TODO: implement!
    console.log("CampusExplorer.buildQuery not implemented yet.");
    return query;
};
