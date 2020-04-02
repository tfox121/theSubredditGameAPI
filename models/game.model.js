const mongoose = require('mongoose');
const shortid = require('shortid');

shortid.characters(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@'
);

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  currentGuess: { type: String, default: '' },
  score: { type: Number, default: 0 },
  lastResult: { type: String, default: '' },
  readyForNext: { type: Boolean, default: false }
});

const GuessSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  percentage: { type: Number, required: true },
  subName: { type: String, required: true }
});

const MessageSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  message: { type: String, required: true },
  timeReceived: { type: Date, default: Date.now }
});

const GameSchema = new mongoose.Schema({
  _id: { type: String, default: shortid.generate },
  roundComplete: { type: Boolean, default: false },
  gameComplete: { type: Boolean, default: false },
  currentSub: {},
  subList: [],
  currentRound: { type: Number, default: 1 },
  rounds: { type: Number, required: true },
  gameStarted: { type: Boolean, default: false },
  nsfw: { type: Number, default: 0 },
  closestGuess: GuessSchema,
  players: [PlayerSchema],
  messages: [MessageSchema]
});

const Game = mongoose.model('Game', GameSchema);

module.exports = Game;
