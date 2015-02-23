/**
 * Created by marc on 1/1/15.
 */

"use strict"

/**
 * Created by marc on 12/28/14.
 */

var bodyparser = require("body-parser");
var express = require("express");
var mongoClient = require("mongodb");

var server = express();
mongoClient.connect("mongodb://localhost:27017/measurementsDB", startListening);

var db = null;
var data = null;

server.use(bodyparser.urlencoded({extended: true}));
server.use(bodyparser.json());

server.post("/postHere/", postFromTessel);

function stickIntoDatabase(measurement) {
    data.insert(measurement, function() {});
}

function postFromTessel(request, response) {
    console.log("Got into postFromTessel");
    var measurement = request.body;
    console.log(measurement);
    console.log("=**********************************************************************=");
    response.write("200 OK");
    response.end();
    stickIntoDatabase(measurement, function(){});

}

function startListening(err, db) {
    if (err) {
        return console.dir(err);
    } else {
        server.listen(8080);
        data = db.collection("data");
    }
}
