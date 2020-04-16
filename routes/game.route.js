const express = require('express');
const cors = require('cors');

const { corsOptions } = require('../app');

const router = express.Router();
const GameController = require('../controllers/game.controller');
const MessageController = require('../controllers/message.controller');


// create new game
router.post('/', cors(corsOptions), GameController.createGame);

// fetch all games
router.get('/', cors(corsOptions), GameController.fetchGames);

// fetch client's games
router.get('/current/:clientId', cors(corsOptions), GameController.fetchGamesByClient);

// fetch single game
router.get('/:id', cors(corsOptions), GameController.fetchGame);

// generate subreddit
router.get('/generate/:nsfw', cors(corsOptions), GameController.generateSubreddit);

// start new round
router.patch('/:id/new', cors(corsOptions), GameController.newRound);

// edit game
router.patch('/:id', cors(corsOptions), GameController.editGame);

// create new message
router.post('/:id/message', cors(corsOptions), MessageController.createMessage);

// fetch all messages
router.get('/:id/message', cors(corsOptions), MessageController.fetchMessages);

// delete all games
router.delete('/delete/:auth', cors(corsOptions), GameController.deleteAll);

module.exports = router;
