/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        let xhr = new XMLHttpRequest();
        let url = 'http://cs310.students.cs.ubc.ca:11316/api/v1/project_team097/';

        xhr.open('POST', url + query, true);
        xhr.setRequestHeader('Content-type', 'application/json');

        xhr.onload = function () {
            let result = JSON.parse(xhr.response);

            if ('error' in result) {
                reject(result.error);
            } else {
                fulfill(result);
            }
        };

        xhr.onerror = function () {
            reject('Error!');
        };

        query = JSON.stringify(query);

        xhr.send(query);
    });
};
