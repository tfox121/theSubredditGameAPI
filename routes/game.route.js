const express = require('express');
const router = express.Router();
const GameController = require('../controllers/game.controller');

// create new game
router.post('/', GameController.createGame);

// fetch all games
router.get('/', GameController.fetchGames);

// fetch single game
router.get('/:id', GameController.fetchGame);

// edit game
router.patch('/:id', GameController.editGame);

// edit task
router.delete('/:id', GameController.deleteGame);

module.exports = router;
