'use strict';

// requireing express
const express = require('express');
//requiering dotenv config
require('dotenv').config();
//requiering cors
const cors = require('cors');

//asssigning server with express
const server = express();
//init the port from env file or the port 3000
const PORT = process.env.PORT || 3000;

server.use(cors());

server.get('/', (req, res) => {
  res.send('server is alive');
});

// listen to the server
server.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});
