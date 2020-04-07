const Connection = require('../models/connection.model');

module.exports = class ConnectionStore {
  static async createConnection(ipAddress) {
    console.log('New connection');

    const newConnection = new Connection({ ipAddress });
    return await newConnection.save();
  }

  static async fetchConnection(ipAddress) {
    console.log('Retrieving connection');
    return await Connection.findOne({ ipAddress: ipAddress }).exec();
  }

  static async updateConnection(ipAddress, gameId) {
    const connectionData = await this.fetchConnection(ipAddress);
    console.log('connection data:', connectionData);
    if (connectionData.ipAddress) {
      connectionData.lastAccessed = Date.now();
      if (gameId) {
        const newGameObj = { gameId };
        connectionData.push(newGameObj);
      }
      return await connectionData.save();
    }
  }
};
