const GameStore = require('../stores/game.store');
const MessageStore = require('../stores/message.store');

module.exports = class MessageController {
  static async createMessage(req, res, next) {
    try {
      const game = await MessageStore.createMessage(req.params.id, req.body);
      res.json(game);
    } catch (err) {
      next(err);
    }
  }

  static async fetchMessages(req, res, next) {
    try {
      const game = await GameStore.fetchGame(req.params.id);
      res.json(game.messages);
    } catch (err) {
      next(err);
    }
  }
};
