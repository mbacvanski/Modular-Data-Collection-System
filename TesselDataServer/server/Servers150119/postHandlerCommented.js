/**
 * @description receives and stores data from sensing station.
 * It stores the data into a mongoDB database.
 */

//Used to parse the content of requests
var bodyparser = require("body-parser");
//Used to create a web server easily
var express = require("express");
//Importing the database module
var mongoClient = require("mongodb");

var server = express(); //Initializing the server
//Connecting to the mongodb server
mongoClient.connect("mongodb://localhost:27017/measurementsDB", startListening);

var db = null;
var data = null;

//Setting up what the server uses.
server.use(bodyparser.urlencoded({extended: true}));
server.use(bodyparser.json());

//Handle each post request
server.post("/postHere/", postFromTessel);

/**
 * @description Sticks data into the database.
 * @param measurement What data to stick into the database.
 */
function stickIntoDatabase(measurement) {
    data.insert(measurement, function() {});
}

/**
 * @description The post handling function - receives data and returns 200 OK
 * @param request The request body from each post
 * @param response The response object to respond to
 * @callback stickIntoDatabase - to write into the database
 */
function postFromTessel(request, response) {
    console.log("Got into postFromTessel");
    var measurement = request.body;
    console.log(measurement);
    console.log("=**********************************************************************=");
    response.write("200 OK");
    response.end();
    stickIntoDatabase(measurement, function(){});

}

/**
 * @description Begins the server listening on port 8080
 * @param err If there was any error linking to the database
 * @param db The database object.
 */
function startListening(err, db) {
    if (err) {
        return console.dir(err);
    } else {
        server.listen(8080);
        data = db.collection("data");
    }
}
