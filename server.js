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
const superagent = require('superagent');
//routes
server.get('/', rootRouteHandler);
server.get('/location', locationRouteHandler);
server.get('/weather', weatherRouteHandler);
server.get('*', errorRouteHandler);

function rootRouteHandler(req, res) {
  res.send('server is alive');
}

/* https://city-explorer-website.herokuapp.com
/location?city=amman */
function locationRouteHandler(req, res) {
  // console.log(req.query);
  let cityQuery = req.query.city;

  let key = process.env.GEOCODE_API_KEY;
  let locationUrl = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityQuery}&format=json`;

  superagent.get(locationUrl).then(calledBackData => {
    let geoLocationData = calledBackData.body;
    let locationObjectInctance = new Place(cityQuery, geoLocationData);
    res.send(locationObjectInctance);
  });
}
//https://api.weatherbit.io/v2.0/forecast/daily?city=Raleigh,NC&key=API_KEY
function weatherRouteHandler(req, res) {
  // let getWeatherData = require('./data/weather.json');
  // let all = getWeatherData.data.map((item, index) => {
  //   let description = getWeatherData.data[index].weather.description;
  //   let vDate = getWeatherData.data[index].valid_date;
  //   return new Weather(description, vDate);
  // res.send(all);
  let cityQuery = req.query.search_query;

  let key = process.env.WEATHER_API_KEY;
  let weatherUrl = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityQuery}&key=${key}`;

  superagent.get(weatherUrl).then(weatherData => {
    // console.log(weatherData.body);
    // res.send(weatherData.body.data[0].weather.description);
    let weatherComingData = weatherData.body;
    let all = weatherComingData.data.map((item, index) => {
      let description = item.weather.description;
      let vDate = item.valid_date;
      return new Weather(description, vDate);
    });
    res.send(all);
  });
}
function errorRouteHandler(req, res) {
  let errObject = {
    status: 500,
    responseText: 'Sorry, something went wrong',
  };
  res.status(500).send(errObject);
}

const Place = function (cityName, locationData) {
  this.search_query = cityName;
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
