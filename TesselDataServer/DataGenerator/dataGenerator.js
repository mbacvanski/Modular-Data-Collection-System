/**
 * Created by marc on 1/2/15.
 */

var http = require("http");

function getRandomValues() {
    var lightRandom = Math.random();
    var soundRandom = Math.random();
    var humidityRandom = Math.random() * 100;
    var temperatureRandom = Math.random() * 100;

    var JSONLight = {time : createRandomDate(), valueType : "light", value : lightRandom};
    var JSONSound = {time : createRandomDate(), valueType : "sound", value : soundRandom};
    var JSONHumidity = {time : createRandomDate(), valueType : "humidity", value : humidityRandom};
    var JSONTemperature = {time : createRandomDate(), valueType : "temperature", value : temperatureRandom};

    console.log("Light value: " + lightRandom);
    post(JSONLight);
    console.log("Sound value: " + soundRandom);
    post(JSONSound);
    console.log("Humidity value: " + humidityRandom);
    post(JSONHumidity);
    console.log("Temperature value: " + temperatureRandom);
    post(JSONTemperature);
}

function initiateGettingValues() {
    getRandomValues();
    setTimeout(initiateGettingValues, 1);
}

initiateGettingValues();

function createRandomDate() {
    var dateHere = new Date();
    dateHere.setMilliseconds(Math.floor(Math.random() * 1000));
    dateHere.setSeconds(Math.floor(Math.random() * 100));
    dateHere.setMinutes(Math.floor(Math.random() * 60));
    dateHere.setHours(Math.floor(Math.random() * 60));
    dateHere.setDate(Math.floor(Math.random() * 31));
    dateHere.setMonth((Math.floor(Math.random() * 12) + 1));
    dateHere.setYear(2014);
    return dateHere;
}

function post(whatToPost) {
    console.log("About to post: " + JSON.stringify(whatToPost));

    var postOptions = {
        host: '10.0.1.4',
        port: '8080',
        path: '/postHere/',
        method: 'POST',
        headers: {'Content-Type' : 'application/json'}
    };

    var postRequest = http.request(postOptions, function(response) {
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            console.log("Response: " + chunk);
        });
        response.on('error', function(err) {
            console.log("Error: " + err);
        })
    })

    console.log("Posting!");

    postRequest.write(JSON.stringify(whatToPost));
    postRequest.end();
    console.log("Finished posting.");
}