const express = require('express');
const router = express.Router();
const GameController = require('../controllers/game.controller');
const MessageController = require('../controllers/message.controller');

// create new game
router.post('/', GameController.createGame);

// fetch all games
router.get('/', GameController.fetchGames);

// fetch single game
router.get('/:id', GameController.fetchGame);

// generate subreddit
router.get('/generate/:nsfw', GameController.generateSubreddit);

// start new round
router.patch('/:id/new', GameController.newRound);

// edit game
router.patch('/:id', GameController.editGame);

// create new message
router.post('/:id/message', MessageController.createMessage);

// fetch all messages
router.get('/:id/message', MessageController.fetchMessages);

// delete all games
router.delete('/delete/:auth', GameController.deleteAll);

module.exports = router;
