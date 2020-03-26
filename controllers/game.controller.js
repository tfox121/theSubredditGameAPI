const GameStore = require('../stores/game.store');

class GameController {
  static async createGame(req, res, next) {
    try {
      const game = await GameStore.createGame();
      res.json(game);
    } catch (err) {
      next(err);
    }
  }

  static async fetchGames(req, res, next) {
    try {
      const games = await GameStore.fetchGames();
      res.json(games);
    } catch (err) {
      next(err);
    }
  }

  static async fetchGame(req, res, next) {
    try {
      console.log(req.params.id);
      const game = await GameStore.fetchGame(req.params.id);
      res.json(game);
    } catch (err) {
      next(err);
    }
  }

  static async editGame(req, res, next) {
    try {
      console.log('RETRIEVING GAME');
      const game = await GameStore.editGame(req.params.id, req.body);
      console.log('GAME:', game);
      res.json(game);
    } catch (err) {
      console.log('GAME ERROR:', game);

      next(err);
    }
  }

  static async deleteGame(req, res, next) {
    GameStore.deleteGame(req.body);
  }
}

module.exports = GameController;
