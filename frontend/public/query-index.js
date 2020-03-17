/**
 * This hooks together all the CampusExplorer methods and binds them to clicks on the submit button in the UI.
 *
 * The sequence is as follows:
 * 1.) Click on submit button in the reference UI
 * 2.) Query object is extracted from UI using global document object (CampusExplorer.buildQuery)
 * 3.) Query object is sent to the POST /query endpoint using global XMLHttpRequest object (CampusExplorer.sendQuery)
 * 4.) Result is rendered in the reference UI by calling CampusExplorer.renderResult with the response from the endpoint as argument
 */

// TODO: implement!


// EXAMPLE
/**
 * var btn = document.getElementById("btn");
 * var animalContainer = document.getElementById("animal-info");
 *
 * btn.addEventListener("click", function() {
 *    // AJAX call:
 *    var ourRequest = new XMLHttpRequest();
 *    ourRequest.open('GET', 'https://...');
 *    ourRequest.onload = function() {
 *        var ourData = JSON.prase(ourRequest.responseText);
 *        renderHTML(ourData);
 *    };
 *    ourRequest.send();
 * });
 *
 * // add HTML to the page; more specifically, add html to a div element
 * function renderHTML(data) {
 * var htmlString = "";
 *
 * // loop through data.
 * for (i = 0; i < data.length; i++) {
 *     htmlString += "<p>" + data[i]name + "is a " + data[i].species ".</p>"
 * }
 *
 *  animalContainer.insertAdjacentHTML('beforeend', htmlString);
 * }
 */
