'use strict';
require('dotenv').config();
// requireing express
const express = require('express');
//requiering dotenv config

//requiering cors
const cors = require('cors');

//requiering the postgres sql
const pg = require('pg');
//asssigning server with express
const server = express();
//init the port from env file or the port 3000
const PORT = process.env.PORT || 3000;
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized: false,
  // },
});

server.use(cors());
const superagent = require('superagent');
//routes
server.get('/', rootRouteHandler);
server.get('/location', locationRouteHandler);
server.get('/weather', weatherRouteHandler);
server.get('/parks', parksRouteHandler);
server.get('/movies', moviesRouteHandler);
server.get('*', errorRouteHandler);

function rootRouteHandler(req, res) {
  res.send('server is alive');
}

/* https://city-explorer-website.herokuapp.com
/location?city=amman */
function locationRouteHandler(req, res) {
  // console.log(req.query);
  let cityQuery = req.query.city;
  //let exists = chechLoaction(cityQuery);
  //let exists = await getLoctionData(cityQuery);

  let SQL = `SELECT * FROM locations WHERE search_query=$1;`;
  client.query(SQL, [cityQuery]).then(result => {
    //console.log('ffffffffffffffffffffff', result);

    if (result.rows.length > 0) {
      //database

      console.log('exists');
      res.send(result.rows[0]);
    } else {
      console.log('not exists');
      //api
      let key = process.env.GEOCODE_API_KEY;
      let locationUrl = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityQuery}&format=json`;

      superagent.get(locationUrl).then(calledBackData => {
        let geoLocationData = calledBackData.body;
        let locationObjectInctance = new Place(cityQuery, geoLocationData);
        saveDatabase(locationObjectInctance);
        res.send(locationObjectInctance);
      });
    }
  });
}

function saveDatabase(locationObjectInctance) {
  let SQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *;`;
  client
    .query(SQL, [
      locationObjectInctance.search_query,
      locationObjectInctance.formatted_query,
      locationObjectInctance.latitude,
      locationObjectInctance.longitude,
    ])
    .then(result => result)
    .catch(error => error);
}
//https://api.weatherbit.io/v2.0/forecast/daily?city=Raleigh,NC&key=API_KEY
function weatherRouteHandler(req, res) {
  let cityQuery = req.query.search_query;

  let key = process.env.WEATHER_API_KEY;
  let weatherUrl = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityQuery}&key=${key}`;

  superagent.get(weatherUrl).then(weatherData => {
    let weatherComingData = weatherData.body;
    let all = weatherComingData.data.map((item, index) => {
      let description = item.weather.description;
      let vDate = item.valid_date;
      return new Weather(description, vDate);
    });
    res.send(all);
  });
}
// https://developer.nps.gov/api/v1/parks?
// parkCode=acad&api_key=ScF1GDnYttsgWhQM4mZVRuqk436wro4peIVIfhv7
function parksRouteHandler(req, res) {
  // https://developer.nps.gov/api/v1/parks?parkCode=abcd&limit=50
  let cityName = req.query.search_query;
  let key = process.env.PARKS_API_KEY;
  let locURL = `https://developer.nps.gov/api/v1/parks?q=${cityName}&api_key=${key}`;
  superagent.get(locURL).then(parksData => {
    let arr = parksData.body.data.map((item, index) => {
      return new Park(item);
    });
    res.send(arr);
  });
}

function moviesRouteHandler(req, res) {
  // https://api.themoviedb.org/3/movie/550?api_key=73b93cdfca2e825942947127fcf95717
  let cityQuery = req.query.search_query;
  let key = process.env.MOVIE_API_KEY;
  let moviesURL = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${cityQuery}`;
  superagent.get(moviesURL).then(moviesData => {
    let moviesArray = moviesData.body.results.map(item => {
      return new Movie(item);
    });
    res.send(moviesArray);
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
const Park = function (parksData) {
  this.name = parksData.fullName;
  this.address = `${parksData.addresses[0].line1}, ${parksData.addresses[0].stateCode}, ${parksData.addresses[0].city}`;
  this.fee = parksData.entranceFees[0].cost;
  this.description = parksData.description;
  this.url = parksData.url;
};

const Movie = function (moviesData) {
  this.title = moviesData.title;
  this.overview = moviesData.overview;
  this.average_votes = moviesData.vote_average;
  this.total_votes = moviesData.vote_count;
  this.image_url = moviesData.backdrop_path;
  this.popularity = moviesData.popularity;
  this.released_on = moviesData.release_date;
};

// listen to the server
client.connect().then(() => {
  server.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
  });
});
