const Connection = require('../models/connection.model');

module.exports = class ConnectionStore {
  static async createConnection(ipAddress) {
    console.log('New connection');

    const newConnection = new Connection({ ipAddress });
    return newConnection.save();
  }

  static async fetchConnection(ipAddress) {
    console.log('Retrieving connection');
    return Connection.findOne({ ipAddress }).exec();
  }

  static async updateConnection(ipAddress, gameId) {
    const connectionData = await this.fetchConnection(ipAddress);
    if (connectionData.ipAddress) {
      connectionData.lastAccessed = Date.now();
      if (gameId) {
        if (!connectionData.games.some((game) => game.gameId === gameId)) {
          const newGameObj = { gameId };
          connectionData.games.unshift(newGameObj);
        }
      }
      return connectionData.save();
    }
    return null;
  }
};
