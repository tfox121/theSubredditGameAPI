const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');

const gameRoute = require('./routes/game.route');

// Set up the express app
const app = express();

// Log requests to the console.
app.use(logger('dev'));

app.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://subreddit-game.herokuapp.com'
  );

  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  }

  // Request methods you wish to allow
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );

  // Request headers you wish to allow
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type'
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

// Parse incoming requests data (https://github.com/expressjs/body-parser)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/games', gameRoute);

// Setup a default catch-all route that sends back a welcome message in JSON format.
app.get('*', (req, res) =>
  res.status(200).send({
    message: 'Welcome to the beginning of subreddit game API!'
  })
);

module.exports = app;
