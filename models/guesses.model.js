const mongoose = require('mongoose');

const GuessSchema = new mongoose.Schema({
  submitDate: { type: Date, default: Date.now },
  guess: { type: Number, required: true },
  subscribers: { type: Number, required: true },
  clientId: { type: String },
});

const GuessesSchema = new mongoose.Schema(
  {
    createdOn: { type: Date, default: Date.now },
    subredditName: { type: String, required: true },
    nsfw: { type: Boolean, required: true },
    guesses: [GuessSchema],
  },
  { collection: 'guesses' },
);

const Guesses = mongoose.model('Guesses', GuessesSchema, 'guesses');

module.exports = Guesses;
