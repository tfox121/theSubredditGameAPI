if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = require('../app');
const mongoose = require('mongoose');
const WebSocket = require('ws');

const ConnectionStore = require('../stores/connection.store');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const port = parseInt(process.env.PORT, 10) || 8000;

const server = app.listen(port, () => {
  console.log(`Subreddit Game API listening on port ${port}!`);
});

const wss = new WebSocket.Server({ server });

const notifyClients = (server, currentClient, type, game) => {
  server.clients.forEach(client => {
    if (client != currentClient && client.currentGame === game) {
      const socketData = JSON.stringify({
        type,
        game
      });
      client.send(socketData);
    }
  });
};

wss.on('connection', async (ws, req) => {
  console.log('Connection!', req.connection.remoteAddress);
  const { remoteAddress } = req.connection;

  try {
    const existingData = await ConnectionStore.fetchConnection(remoteAddress);
    if (existingData.ipAddress) {
      const updatedData = await ConnectionStore.updateConnection(remoteAddress);
      // console.log(updatedData);
    } else {
      const newData = await ConnectionStore.createConnection(remoteAddress);
      // console.log(newData);
    }
  } catch (err) {
    console.error(err);
  }

  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async message => {
    const msg = JSON.parse(message);
    console.log('Received message', msg.type);

    switch (msg.type) {
      case 'UPDATE':
        console.log('UPDATE');
        notifyClients(wss, ws, 'UPDATE', msg.game);
        break;
      case 'CREATE':
        console.log('CREATE');
        ws.currentGame = msg.game;
        break;
      case 'JOIN':
        console.log('JOIN');
        ws.currentGame = msg.game;
        const updatedData = await ConnectionStore.updateConnection(
          remoteAddress,
          msg.game
        );
        console.log(updatedData);
        break;
      case 'CLEAR':
        console.log('CLEAR');
        delete ws.currentGame;
        break;
      case 'MESSAGE':
        console.log('MESSAGE');
        notifyClients(wss, ws, 'MESSAGE', msg.game);
        break;
      default:
        console.log('Invalid type');
        break;
    }
  });
});

setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) {
      console.log('Killing connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping(null, false, true);
  });
}, 10000);
