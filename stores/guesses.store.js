const Guesses = require('../models/guesses.model');

module.exports = class GuessesStore {
  static async createGuesses(subredditName, nsfw) {
    const newGuessesObj = new Guesses({ subredditName, nsfw });

    return await newGuessesObj.save();
  }

  static async fetchGuesses(subredditName) {
    console.log('Retrieving guesses');
    return await Guesses.findOne({ subredditName: subredditName }).exec();
  }

  static percentCalc(num1, num2) {
    return Math.abs(100 - (num1 / num2) * 100);
  }

  static async fetchGuessesAverage(subredditName) {
    console.log('Retrieving guesses average');
    const guessObj = await Guesses.findOne({
      subredditName: subredditName
    }).exec();
    if (!guessObj) {
      return;
    }
    const average =
      guessObj.guesses.reduce((total, next) => {
        return total + this.percentCalc(next.guess, next.subscribers);
      }, 0) / guessObj.guesses.length;
    return average.toFixed(2);
  }

  static async fetchRandomGuesses(nsfw) {
    const count = await Guesses.countDocuments({ nsfw: nsfw }).exec();

    const random = Math.floor(Math.random() * count);

    console.log(count, random);

    const guesses = await Guesses.findOne({ nsfw: nsfw })
      .skip(random)
      .exec();

    return guesses.subredditName;
  }

  static async fetchCoveragePercentage(nsfw) {
    const count = await Guesses.countDocuments({ nsfw: nsfw }).exec();

    let coverage, baseline;
    if (!nsfw) {
      coverage = count / (2020041 * 0.942);
      baseline = 0.05;
    } else {
      coverage = count / (2020041 * 0.058);
      baseline = 0.025;
    }

    return baseline > coverage ? baseline : coverage;
  }

  static async fetchNsfwCoveragePercentage() {
    const count = await Guesses.countDocuments({ nsfw: true }).exec();

    const coverage = count / (2020041 * 0.058);
    const baseline = 0.025;

    return baseline > coverage ? baseline : coverage;
  }

  static async updateGuesses(
    subredditName,
    nsfw,
    guess,
    subscribers,
    clientId
  ) {
    let guessesData = await this.fetchGuesses(subredditName);
    if (!guessesData) {
      guessesData = await this.createGuesses(subredditName, nsfw);
    }
    guessesData.guesses = [
      { guess, subscribers, clientId },
      ...guessesData.guesses
    ];
    return await guessesData.save();
  }
};
