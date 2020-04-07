const GameStore = require('../stores/game.store');

module.exports = class MessageStore {
  static async createMessage(id, requestBody) {
    const gameData = await GameStore.fetchGame(id);
    const { playerName, message } = requestBody;

    gameData.messages.push({ playerName, message });

    return await gameData.save();
  }
};
