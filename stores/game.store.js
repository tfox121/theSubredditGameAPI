const Game = require('../models/game.model');

class GameStore {
  // add new game to database
  static async createGame() {
    const newGame = new Game({});
    console.log('New game created');
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
    if (requestBody.currentSub) {
      console.log('EDIT:', requestBody.currentSub.display_name, id);
      gameData.currentSub = requestBody.currentSub;
      if (gameData.roundComplete) {
        gameData.roundComplete = false;
        gameData.round++;
      }
      gameData.players.forEach(player => {
        player.currentGuess = '';
      });
    }
    if (requestBody.guess) {
      console.log('EDIT:', requestBody.player, requestBody.guess, id);
      gameData.players.forEach(player => {
        if (player.name === requestBody.player) {
          player.currentGuess = requestBody.guess;
        }
      });
      const roundComplete = await this.checkRoundComplete(gameData);
      if (roundComplete) {
        gameData.roundComplete = true;
        gameData.gameStarted = true;
        const resultsObj = await this.addScores(gameData);
        gameData.players.forEach(player => {
          player.score += resultsObj[player.name];
        });
      }
    }
    return await gameData.save();
  }

  // check game to see if every player has submitted a guess
  static async checkRoundComplete(gameData) {
    if (!gameData.roundComplete) {
      console.log('Checking complete...');
      if (gameData.players.length < 2) {
        console.log('Not complete');
        return;
      }
      let roundComplete = true;
      gameData.players.forEach(player => {
        if (!player.currentGuess) {
          roundComplete = false;
        }
      });
      return roundComplete;
    }
  }

  // calculate scores for game round and add to total
  static async addScores(gameData) {
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
        score[Object.keys(score)[0]] = resultsArr.length - index - 1;
      });
    return Object.assign({}, ...resultsArr);
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
}

module.exports = GameStore;
