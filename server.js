'use strict';

// requireing express
const express = require('express');
//requiering dotenv config

//requiering cors
const cors = require('cors');

//asssigning server with express
const server = express();
//init the port from env file or the port 3000
const PORT = process.env.PORT || 3000;
require('dotenv').config();
server.use(cors());

//routes
server.get('/', rootRouteHandler);
server.get('/location', locationRouteHandler);
server.get('/weather', weatherRouteHandler);
server.get('*', errorRouteHandler);

function rootRouteHandler(req, res) {
  res.send('server is alive');
}
function locationRouteHandler(req, res) {
  let locationData = require('./data/location.json');
  //   console.log('server.get   locationData', locationData);
  let cityData = new Place(locationData);
  res.send(cityData);
}
function weatherRouteHandler(req, res) {
  let getWeatherData = require('./data/weather.json');

  let all = getWeatherData.data.map((item, index) => {
    let description = getWeatherData.data[index].weather.description;
    let vDate = getWeatherData.data[index].valid_date;
    return new Weather(description, vDate);
  });
  res.send(all);
}
function errorRouteHandler(req, res) {
  let errObject = {
    status: 500,
    responseText: 'Sorry, something went wrong',
  };
  res.status(500).send(errObject);
}

const Place = function (locationData) {
  this.search_query = 'Lynwood';
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
};
const Weather = function (desc, dat) {
  this.forecast = desc;
  this.time = dat;
};

// listen to the server
server.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});
