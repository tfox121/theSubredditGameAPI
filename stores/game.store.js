const fetch = require('node-fetch');
const r = require('../snoowrap');

const Game = require('../models/game.model');
const GuessesStore = require('../stores/guesses.store');

module.exports = class GameStore {
  // add new game to database
  static async createGame(requestBody) {
    const { rounds, nsfw } = requestBody;
    console.log('New game created');

    const subList = [await this.generateSubreddit(nsfw)];
    // for (let i = 0; i < 5; i++) {
    //   subList.push(await this.generateSubreddit(nsfw));
    // }

    const newGame = new Game({ rounds, subList, nsfw });
    return await newGame.save();
  }

  // return list of all games
  static async fetchGames() {
    console.log('Retrieving games');
    return await Game.find({}).exec();
  }

  // return list of all games including player wih clientId
  static async fetchGamesByClient(clientId) {
    console.log('Retrieving games', clientId);
    return await Game.find({
      'players.clientId': clientId,
      gameComplete: false
    })
      .sort({ lastAction: 'desc' })
      .limit(10)
      .exec();
  }

  // find task by id, return task database object
  static async fetchGame(id) {
    console.log('Retrieving game', id);
    return await Game.findById(id).exec();
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
    console.log('REFRESHING');
    while (gameData.subList.length < 2) {
      gameData.subList.push(await this.generateSubreddit(gameData.nsfw));
    }
    gameData.save();
  }

  static async generateSingleSub(nsfw) {
    return await this.generateSubreddit(nsfw);
  }

  // check if player exists in game
  static checkPlayer(playerName, gameData) {
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

  static checkClientId(clientId, gameData) {
    let playerObj = null;
    if (gameData.players) {
      gameData.players.forEach(player => {
        if (player.clientId === clientId) {
          playerObj = player;
        }
      });
    }
    return playerObj;
  }

  // edit existing game according to id
  static async editGame(id, requestBody) {
    const { newPlayer, clientId } = requestBody;
    const gameData = await this.fetchGame(id);
    // if (newPlayer) {
    //   console.log('EDIT:', newPlayer, clientId, id, gameData.players);

    //   const clientExisting = this.checkClientId(clientId, id);

    //   if (!playerUnique) {
    //     console.log('Joining as existing player');
    //     gameData.playerName = clientExisting && clientExisting.name;
    //     return gameData;
    //   } else if (gameData.gameStarted) {
    //     console.log('Game already started');
    //     return;
    //   } else {
    //     console.log('New player');
    //     const playerObj = {
    //       name: newPlayer,
    //       clientId
    //     };
    //     gameData.players.push(playerObj);
    //   }
    // }
    if (clientId && newPlayer) {
      console.log('EDIT:', clientId, id);

      const clientExisting = this.checkClientId(clientId, gameData);
      const playerUnique = this.checkPlayer(newPlayer, gameData);

      if (clientExisting) {
        console.log('Joining as existing player', clientExisting.name);
        gameData.playerName = clientExisting.name;
        return gameData;
      }
      if (!playerUnique) {
        console.log('Name already in use');
      }
      if (gameData.gameStarted) {
        console.log('Game already started');
        return;
      }
      console.log('New player');
      const playerObj = {
        name: newPlayer,
        clientId
      };
      gameData.players.push(playerObj);
    }
    if (requestBody.guess) {
      let data = await GuessesStore.fetchGuesses(
        gameData.currentSub.display_name
      );
      if (!data) {
        data = await GuessesStore.createGuesses(
          gameData.currentSub.display_name
        );
      }
      console.log('EDIT:', requestBody.player, requestBody.guess, id);
      gameData.players.forEach(player => {
        if (player.name === requestBody.player) {
          player.currentGuess = requestBody.guess;
          GuessesStore.updateGuesses(
            gameData.currentSub.display_name,
            requestBody.guess,
            gameData.currentSub.subscribers,
            player.clientId
          );
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
      gameData.lastAction = Date.now();
    }
    console.log('SAVING');
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
      gameData.lastAction = Date.now();
      gameData.gameStarted = true;
      console.log('Everyone Ready!');
      gameData.currentSub = gameData.subList[0];
      gameData.subList.shift();
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
