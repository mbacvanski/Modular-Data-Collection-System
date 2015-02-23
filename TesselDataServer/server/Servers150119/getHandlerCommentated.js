//Import the libraries needed for the program
var express = require("express");
var mongoClient = require("mongodb");

var server = express(); //Initiate the web server
//Connect to the MongoDB database.
mongoClient.connect("mongodb://localhost:27017/measurementsDB", startListening);
server.locals.title = "Modular Data Collection";

var data = null;
var currentPage = 0;
var totalLength = 0;
var totalPages = 0;

const PAGE_SIZE = 750;

//setup middleware
var pub = __dirname + "/public";
server.use(express.static(pub));
server.use(function (err, req, res, next) {
    server.send(err.stack);
});

//Setup the server pages and public directories
server.set('views', __dirname + '/views');
server.set("index", "views"); //Where the Jade file is
server.set("view engine", "jade"); //Set up the Jade view engine
server.get("/", getHomePage);
server.get("/currentData", function (request, response) {
    getCurrentValues(response, "light");
    getCurrentValues(response, "sound");
    getCurrentValues(response, "temperature");
    getCurrentValues(response, "humidity");
});
//Implements pagination for the data display
server.get('/graphs', function (request, response) {
    console.log("About to render!");
    //Response is passed in as a parameter that goes all the way down

    var direction = request.query.direction;
    if (direction == "next" && currentPage > 0) {
        currentPage -= 1;
        getGraphValues(response, "light", currentPage);
        getGraphValues(response, "sound", currentPage);
        getGraphValues(response, "temperature", currentPage);
        getGraphValues(response, "humidity", currentPage);
    } else if (direction == "previous" && currentPage < totalPages - 1) {
        currentPage += 1;
        getGraphValues(response, "light", currentPage);
        getGraphValues(response, "sound", currentPage);
        getGraphValues(response, "temperature", currentPage);
        getGraphValues(response, "humidity", currentPage);
    } else if (direction == undefined) {
        currentPage = 0;
        getGraphValues(response, "light", currentPage);
        getGraphValues(response, "sound", currentPage);
        getGraphValues(response, "temperature", currentPage);
        getGraphValues(response, "humidity", currentPage);
    } else {
        response.render("noMoreData");
    }
});
//Oops.
server.get("*", function (request, response) {
    console.log("If you're seeing this, the site is broken.  OOPS!");
});

/**
 * @description Gets the current values from the database with a certain type.
 * @param response The variable for the response back the user.  It is passed
 *        all the way down to whichever function needs it to render the response.
 * @param type The type of values to look for from the database.
 */
function getCurrentValues(response, type) {
    console.log("getCurrentValues was called with type " + type);
    var valueStream = data.find({valueType: type}).sort({time: 1}).stream();
    var allValues = new Array();
    var currentValue = null;

    valueStream.on("data", function (item) {
        allValues.push(item);
    });

    valueStream.on("end", function () {
        currentValue = allValues[0];
        checkIfAllDone(response, type, currentValue, displayCurrent);
    });
}

var temperature = null;
var humidity = null;
var light = null;
var sound = null;

/**
 * @description Checks if all the reading from the database for values is finished.
 * @param response The response variable passed all the way down - used to render
 *        the response when done.
 * @param type The type of response - which was the value type of the data read.
 * @param data The actual values of the data with type type.
 * @param callback The callback to call when this is done.
 */
function checkIfAllDone(response, type, data, callback) {
    console.log("CheckIfAllDone was called with type " + type);
    console.log(type + " has a value of ")
    if (type === "light") {
        console.log("Checking if all is done from light!");
        light = data;
    } else if (type === "temperature") {
        console.log("Checking if all is done from temperature!");
        temperature = data;
    } else if (type === "sound") {
        console.log("Checking if all is done from sound!");
        sound = data;
    } else if (type === "humidity") {
        console.log("Checking if all is done from humidity!");
        humidity = data;
    } else {
        console.log("Couldn't recognize the type!");
    }
    if (temperature != null && humidity != null && light != null && sound != null) {
        console.log("All is done - displaying data!");
        callback(response, temperature, humidity, light, sound);
        temperature = null;
        humidity = null;
        light = null;
        sound = null;
    }
}

/**
 * @description Renders the response to the user with the types of data.
 * @param response The response variable, passed down to render the data
 * @param temp The temperature values
 * @param humid The humidity values
 * @param li The light values
 * @param sou The sound values.
 */
function displayCurrent(response, temp, humid, li, sou) {
    var temperature = temp.value;
    var temperatureTime = temp.time;
    var humidity = humid.value;
    var humidityTime = humid.time;
    var sound = sou.value;
    var soundTime = sou.time;
    var light = li.value;
    var lightTime = li.time;
    response.render('currentData.jade', {
        temperature: temperature,
        temperatureTime: temperatureTime,
        humidity: humidity,
        humidityTime: humidityTime,
        sound: sound,
        soundTime: soundTime,
        light: light,
        lightTime: lightTime
    });

}

/**
 * @description Renders the home page of the server.
 * @param request The request from the user - not used.
 * @param response The response object - to send the response.
 */
function getHomePage(request, response) {
    response.render("layout", {});
}

/////////////////////////////////////////////////////////////////////////

/**
 * @description Gets data values for the graph webpage.
 * @param response The response to the user when rendering -
 *        passed all the way down
 * @param type The type of values to render
 * @param start At which point to start rendering - allows
 *        for pagination of the graphs.
 */
function getGraphValues(response, type, start) {
    var dataRows = new Array; //Will be used later

    var dataStream = data.find({valueType: type}).sort({time: -1}).
        skip(start * PAGE_SIZE).limit(PAGE_SIZE).stream();

    console.log("Finished creating the data stream!");

    dataStream.on("data", function (item) {
        console.log("Streaming data!");
        var time = item.time;
        var value = item.value;
        dataRows.push([time, value, undefined, undefined]);
    });

    dataStream.on("end", function () {
        checkIfAllDone(response, type, dataRows, graphData);
        console.log("Finished streaming data!");
    });
}

/**
 * @description Renders all the data for the graph portion of the web page
 * @param response The response object to render data
 * @param temperatureArray The temperature values
 * @param humidityArray The humidity values
 * @param lightArray The light values
 * @param soundArray The sound values
 */
function graphData(response, temperatureArray, humidityArray, lightArray, soundArray) {
    console.log("Got into graphData!");
    var temperatureJSON = JSON.stringify(temperatureArray);
    var humidityJSON = JSON.stringify(humidityArray);
    var lightJSON = JSON.stringify(lightArray);
    var soundJSON = JSON.stringify(soundArray);
    console.log("Finished making the JSON gurgles!");
    response.render('graphs.jade', {dataToRender: lightJSON});
}

/////////////////////////////////////////////////////////////////////////

/**
 * @description Starts the server listening after the database setup is done
 * @param err If there was any error in setting up the database connection
 * @param db The object for the database
 */
function startListening(err, db) {
    if (err) {
        return console.dir(err);
        console.log("Errored!");
    } else {
        data = db.collection("data");
        console.log("Got to before finding!");
        data.find({}).count(function (err, count) {
            if (!err) {
                totalLength = count;
                totalPages = totalLength / PAGE_SIZE;
                server.listen(8123);
                console.log("Listening!");
                updateCount();
            } else {
                console.log("Oi Jeeb!  Errored in counting the database...");
            }
        });
        console.log("Got to after finding and counting; before calculating pages");
    }
}

/**
 * @description Counts the length of the database every 1.5 seconds to
 *              ensure the accuracy and precision of database readings
 */
function updateCount() {
    data.find({}).count(function (err, count) {
        if (!err) {
            totalLength = count;
            totalPages = totalLength / PAGE_SIZE;
        } else {
            console.err("Oi Jeeb!  Error in counting database!");
        }
    });
    setTimeout(updateCount, 1500);
}