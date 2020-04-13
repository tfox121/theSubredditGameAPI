const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  timeCreated: { type: Date, default: Date.now },
  gameId: { type: String, required: true },
});

const ConnectionSchema = new mongoose.Schema(
  {
    firstAccessed: { type: Date, default: Date.now },
    lastAccessed: { type: Date, default: Date.now },
    ipAddress: { type: String },
    games: [GameSchema],
  },
  { collection: 'connections' },
);

const Connection = mongoose.model(
  'Connection',
  ConnectionSchema,
  'connections',
);

module.exports = Connection;
