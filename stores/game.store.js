const fetch = require('node-fetch');
const r = require('../snoowrap');

const Game = require('../models/game.model');

module.exports = class GameStore {
  // add new game to database
  static async createGame(requestBody) {
    const { rounds, nsfw } = requestBody;
    console.log('New game created');

    const subList = [];
    for (let i = 0; i < 5; i++) {
      subList.push(await this.generateSubreddit(nsfw));
    }

    const newGame = new Game({ rounds, subList, nsfw });
    return await newGame.save();
  }

  // return list of all games
  static async fetchGames() {
    console.log('Retrieving games');
    return await Game.find({}).exec();
  }

  // find task by id, return task database object
  static async fetchGame(id) {
    console.log('Retrieving game', id);
    return await Game.findById(id).exec();
  }

  // check if player exists in game by id
  static async checkPlayer(id, playerName) {
    const gameData = await this.fetchGame(id);
    let playerUnique = true;
    if (gameData.players) {
      gameData.players.forEach(player => {
        if (player.name === playerName) {
          playerUnique = false;
        }
      });
    }
    return playerUnique;
  }

  static async generateSubreddit(nsfwLevel) {
    const nsfwInt = parseInt(nsfwLevel, 10);
    let url;
    const randomNum = Math.random();

    if (nsfwInt === 0 || (nsfwInt === 1 && randomNum <= 0.7)) {
      console.log('SFW');
      url = 'https://www.reddit.com/r/random/about.json';
    } else {
      console.log('NSFW');
      url = 'https://www.reddit.com/r/randnsfw/about.json';
    }

    const subData = await fetch(url);
    const subDataJson = await subData.json();

    console.log(subDataJson.data.display_name);
    const topPosts = await r
      .getSubreddit(subDataJson.data.display_name)
      .getTop({ time: 'all' });
    subDataJson.data.topPost = JSON.parse(JSON.stringify(topPosts[0]));

    return subDataJson.data;
  }

  static async subRefresh(gameData) {
    gameData.subList.shift();
    gameData.subList.push(await this.generateSubreddit(gameData.nsfw));
    gameData.save();
  }

  static async generateSingleSub(nsfw) {
    return await this.generateSubreddit(nsfw);
  }

  // edit existing game according to id
  static async editGame(id, requestBody) {
    const gameData = await this.fetchGame(id);
    if (requestBody.newPlayer) {
      console.log('EDIT:', requestBody.newPlayer, id);

      const playerUnique = await this.checkPlayer(id, requestBody.newPlayer);
      if (!playerUnique) {
        console.log('Joining as existing player');
        return gameData;
      }
      if (gameData.gameStarted) {
        console.log('Game already started');
        return;
      }
      console.log('New player');
      const newPlayer = {
        name: requestBody.newPlayer
      };
      gameData.players = [newPlayer, ...(gameData.players && gameData.players)];
    }
    if (requestBody.guess) {
      console.log('EDIT:', requestBody.player, requestBody.guess, id);
      gameData.players.forEach(player => {
        if (player.name === requestBody.player) {
          player.currentGuess = requestBody.guess;
        }
      });
      const roundComplete = await this.checkRoundOrGameComplete(gameData);
      if (roundComplete) {
        gameData.roundComplete = true;
        const resultsObj = await this.calcScores(gameData);
        gameData.players.forEach(player => {
          player.score += resultsObj[player.name];
          player.lastResult = resultsObj[player.name].toString();
        });
      }
    }
    return await gameData.save();
  }

  // check game to see if every player has submitted a guess
  static async checkRoundOrGameComplete(gameData) {
    if (!gameData.roundComplete) {
      console.log('Checking complete...');
      let roundComplete = true;
      gameData.players.forEach(player => {
        if (!player.currentGuess) {
          roundComplete = false;
        }
      });
      if (roundComplete && gameData.rounds <= gameData.currentRound) {
        gameData.gameComplete = true;
      }
      return roundComplete;
    }
  }

  // calculate scores for game round
  static async calcScores(gameData) {
    console.log('Adding scores');
    if (!gameData.roundComplete) {
      return;
    }

    const percentCalc = (num1, num2) => {
      return Math.abs(100 - (num1 / num2) * 100);
    };

    const resultsArr = gameData.players.map(player => {
      return {
        [player.name]: percentCalc(
          player.currentGuess,
          gameData.currentSub.subscribers
        )
      };
    });

    resultsArr
      .sort((a, b) => {
        if (Object.values(a)[0] < Object.values(b)[0]) {
          return -1;
        }
        if (Object.values(a)[0] > Object.values(b)[0]) {
          return 1;
        }
        return 0;
      })
      .forEach((score, index) => {
        const playerName = Object.keys(score)[0];
        if (
          !gameData.closestGuess ||
          score[playerName] < gameData.closestGuess.percentage
        ) {
          gameData.closestGuess = {
            playerName: playerName,
            percentage: score[playerName],
            subName: gameData.currentSub.display_name_prefixed
          };
        }
        score[Object.keys(score)[0]] = resultsArr.length - index - 1;
      });
    return Object.assign({}, ...resultsArr);
  }

  static async newRound(id, currentPlayer) {
    console.log('EDIT:', id);
    const gameData = await this.fetchGame(id);
    if (gameData.rounds === gameData.currentRound) {
      return;
    }

    let readyForNextRound = true;

    gameData.players.forEach(player => {
      if (player.name === currentPlayer) {
        player.readyForNext = true;
      }
      if (player.readyForNext === false) {
        readyForNextRound = false;
        console.log('Waiting on players...');
      }
    });
    if (
      readyForNextRound &&
      (!gameData.gameStarted || gameData.roundComplete)
    ) {
      gameData.gameStarted = true;
      console.log('Everyone Ready!');
      gameData.currentSub = gameData.subList[0];
      if (gameData.roundComplete) {
        gameData.roundComplete = false;
        gameData.currentRound++;
      }
      gameData.players.forEach(player => {
        player.currentGuess = '';
        player.readyForNext = false;
      });
    }
    return await gameData.save();
  }

  // delete all games
  static async deleteAll(auth) {
    if (auth === process.env.DELETE_AUTH) {
      const games = await this.fetchGames();
      return await games.deleteMany();
    } else {
      throw 'Auth incorrect';
    }
  }

  // // find task by id and delete
  // static deleteGame(req) {
  //   return new Promise((resolve, reject) => {
  //     Task.find({ _id: req }).deleteOne((err, data) => {
  //       if (!err) {
  //         console.log('Deleting task');
  //         resolve(data);
  //       } else {
  //         console.log('Task delete error');
  //         reject(err);
  //       }
  //     });
  //   });
  // }
};
