const express = require('express');
const cors = require('cors');

const { corsOptions } = require('../app');

const router = express.Router();
const GuessesController = require('../controllers/guesses.controller');

// create new game
router.post('/', cors(corsOptions), GuessesController.addGuess);

router.get('/:subredditName', cors(corsOptions), GuessesController.fetchGuesses);

router.get('/average/:subredditName', cors(corsOptions), GuessesController.fetchGuessesAverage);

module.exports = router;
