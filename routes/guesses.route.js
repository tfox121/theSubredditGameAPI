const express = require('express');

const router = express.Router();
const GuessesController = require('../controllers/guesses.controller');

// create new game
router.post('/', GuessesController.addGuess);

router.get('/:subredditName', GuessesController.fetchGuesses);

router.get('/average/:subredditName', GuessesController.fetchGuessesAverage);

module.exports = router;
