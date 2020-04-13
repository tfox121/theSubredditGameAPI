const GuessesStore = require('../stores/guesses.store');

module.exports = class GuessesController {
  static async addGuess(req, res, next) {
    try {
      const {
        subredditName, nsfw, guess, subscribers, clientId,
      } = req.body;
      console.log(req.body);
      const guesses = await GuessesStore.updateGuesses(
        subredditName,
        nsfw,
        guess,
        subscribers,
        clientId,
      );
      console.log(guesses);
      res.json(guesses);
    } catch (err) {
      next(err);
    }
  }

  static async fetchGuesses(req, res, next) {
    try {
      const guesses = await GuessesStore.fetchGuesses(req.params.subredditName);
      res.json(guesses);
    } catch (err) {
      next(err);
    }
  }

  static async fetchGuessesAverage(req, res, next) {
    try {
      const average = await GuessesStore.fetchGuessesAverage(
        req.params.subredditName,
      );
      res.json(average);
    } catch (err) {
      next(err);
    }
  }
};
