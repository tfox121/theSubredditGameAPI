const GameStore = require('../stores/game.store');

class GameController {
  static async createGame(req, res, next) {
    try {
      console.log(req.body);
      const game = await GameStore.createGame(req.body);
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
      const game = await GameStore.fetchGame(req.params.id);
      res.json(game);
    } catch (err) {
      next(err);
    }
  }

  static async editGame(req, res, next) {
    try {
      const game = await GameStore.editGame(req.params.id, req.body);
      res.json(game);
    } catch (err) {
      next(err);
    }
  }

  static async newRound(req, res, next) {
    try {
      // console.log('RETRIEVING GAME');
      const game = await GameStore.newRound(req.params.id, req.body.player);
      GameStore.subRefresh(game);
      console.log('New Round!');
      res.json(game);
    } catch (err) {
      next(err);
    }
  }
  static async deleteGame(req, res, next) {
    GameStore.deleteGame(req.body);
  }
}

module.exports = GameController;
