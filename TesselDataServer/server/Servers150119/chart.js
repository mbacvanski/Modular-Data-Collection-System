"use strict";

/**
 * Created by marc on 1/2/15.
 */

var express = require('express');
var mongoClient = require("mongodb");

mongoClient.connect("mongodb://localhost:27017/measurementsDB", startListening); //Setup the mongoClient!

var data = null; //Data variable will be used in place of the db variable...

// Path to our public directory
var pub = __dirname + '/public';

// setup middleware
var app = express();
app.use(express.static(pub));


function getAndDisplayAllLight(response) { //Does not do anything with response, but passes it on so that graphData can render...
    var dataRows = new Array; //Will be used later
    var lightStream = data.find({valueType : "light"}).stream();
    lightStream.on("data",  function(item) {
        var addedTime = item.time;
        var addedValue = item.value;
        dataRows.push([addedTime, addedValue, undefined, undefined]); //Create the array to be added to dataRows
    });


    lightStream.on("end", function() {
        displayData(response, dataRows);
    });
}

function displayData(response, data) {
    console.log("Got into graphData!");
    var dataJSON = JSON.stringify(data);
    response.render('chart', {dataToRender : dataJSON});
}


// Optional since express defaults to CWD/views

app.set('views', __dirname + '/views');

// Set our default template engine to "jade"
// which prevents the need for extensions
// (although you can still mix and match)

app.set('view engine', 'jade');


var dataRowsJson = JSON.stringify(dataRows);
console.log(dataRows);

app.get('/values', function(request, response){
    console.log("About to render!");
    //Response is passed in as a parameter that goes all the way down to
    getAndDisplayAllLight(response); //Start the request handling jeeb
});

// change this to a better error handler in your code
// sending stacktrace to users in production is not good
app.use(function(err, req, res, next) {
    res.send(err.stack);
});

//Start the server when everything is ready and there are no errors
function startListening(err, db) {
    if (err) {
        console.log("Error in connecting to database!");
        console.log(err);
    } else {
        data = db.collection("data"); //Assign the database to the database used in our program.
        app.listen(8123);
        console.log('Using port 8123');
    }
}
