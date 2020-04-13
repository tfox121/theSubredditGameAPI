const Guesses = require('../models/guesses.model');

const TOTAL_SUBREDDITS = 2020041;
const NSFW_SPLIT = 0.058;
const SFW_BASELINE = 0.05;
const NSFW_BASELINE = 0.025;

module.exports = class GuessesStore {
  static async createGuesses(subredditName, nsfw) {
    const newGuessesObj = new Guesses({ subredditName, nsfw });

    return newGuessesObj.save();
  }

  static async fetchGuesses(subredditName) {
    console.log('Retrieving guesses');
    return Guesses.findOne({ subredditName }).exec();
  }

  static roundTo2(num) {
    return +`${Math.round(`${num}e+2`)}e-2`;
  }

  static percentCalc(num1, num2) {
    return this.roundTo2(Math.abs(100 - (num1 / num2) * 100));
  }

  static async fetchGuessesAverage(subredditName) {
    console.log('Retrieving guesses average');
    const guessObj = await Guesses.findOne({
      subredditName,
    }).exec();
    if (guessObj) {
      const totalPercent = guessObj
        .guesses
        .reduce((total, next) => total + this.percentCalc(next.guess, next.subscribers), 0);
      const averagePercent = totalPercent / guessObj.guesses.length;
      return this.roundTo2(averagePercent).toString();
    }
    return null;
  }

  static async fetchRandomGuesses(nsfw) {
    const count = await Guesses.countDocuments({ nsfw }).exec();

    const random = Math.floor(Math.random() * count);

    console.log(count, random);

    const guesses = await Guesses.findOne({ nsfw }).skip(random).exec();

    return guesses.subredditName;
  }

  static async fetchCoveragePercentage(nsfw) {
    const count = await Guesses.countDocuments({ nsfw }).exec();

    let coverage; let
      baseline;
    if (!nsfw) {
      coverage = count / (TOTAL_SUBREDDITS * (1 - NSFW_SPLIT));
      baseline = SFW_BASELINE;
    } else {
      coverage = count / (TOTAL_SUBREDDITS * NSFW_SPLIT);
      baseline = NSFW_BASELINE;
    }

    return baseline > coverage ? baseline : coverage;
  }

  static async updateGuesses(
    subredditName,
    nsfw,
    guess,
    subscribers,
    clientId,
  ) {
    let guessesData = await this.fetchGuesses(subredditName);
    if (!guessesData) {
      guessesData = await this.createGuesses(subredditName, nsfw);
    }
    guessesData.guesses = [
      { guess, subscribers, clientId },
      ...guessesData.guesses,
    ];
    return guessesData.save();
  }
};
