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

        // Prepares an Http request to be sent
        // "POST /query: sends a query in JSON format as the request body"
        // Server requests should be set asynchronously:
        //      By sending asynchronously, the JS does not have to wait for the server response, but can instead
        //      execute other scripts while waiting for server response
        //      deal with the response after the response is ready
        xhr.open('POST', url + query, true);

        // Sets the value of an HTTP request header. Must be called after open() and before send()
        // To POST data like an HTML form, add an HTTP header with setRequestHeader() and specify the data
        // you want to send in the send() method
        xhr.setRequestHeader('Content-type', 'application/json');

        // The function to be executed when the request completes successfully
        // Example from Mozilla:
        // xhr.onload = function () {
        //     if (xhr.readyState === xhr.DONE) {
        //         if (xhr.status === 200) {
        //             console.log(xhr.response);
        //             console.log(xhr.responseText);
        //         }
        //     }
        // };
        xhr.onload = function () {
            // do something with the retrieved data
            let result = JSON.parse(xhr.response); //result is now an object
            if ('error' in result) {
                reject(result.error);
            } else {
                fulfill(result);
            }
            // resolve(xhr.response)
        };

        xhr.onerror = function () {
            reject('Error!');
        };

        // The server needs the query to be a string
        query = JSON.stringify(query);

        // send() accepts an optional parameter which lets you specify the request's body, in our case the query
        // so by default the full thing is actually: XMLHttpRequest.send(request's body);
        xhr.send(query);
    });
};


