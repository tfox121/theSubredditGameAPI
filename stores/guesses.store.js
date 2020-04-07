const Guesses = require('../models/guesses.model');

module.exports = class GuessesStore {
  static async createGuesses(subredditName) {
    const newGuessesObj = new Guesses({ subredditName });

    return await newGuessesObj.save();
  }

  static async fetchGuesses(subredditName) {
    console.log('Retrieving guesses');
    return await Guesses.findOne({ subredditName: subredditName }).exec();
  }

  static async updateGuesses(subredditName, guess, subscribers, clientId) {
    let guessesData = await this.fetchGuesses(subredditName);
    if (guessesData) {
      guessesData.guesses = [
        { guess, subscribers, clientId },
        ...guessesData.guesses
      ];
      return await guessesData.save();
    }
  }
};
