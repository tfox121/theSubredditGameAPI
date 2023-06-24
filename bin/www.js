require('dotenv').config();

const mongoose = require('mongoose');
const WebSocket = require('ws');
const app = require('../app');

const ConnectionStore = require('../stores/connection.store');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const port = parseInt(process.env.PORT, 10) || 8000;

const server = app.listen(port, () => {
  console.log(`Subreddit Game API listening on port ${port}!`);
});

const wss = new WebSocket.Server({ server });


wss.on('connection', async (ws, req) => {
  const { remoteAddress } = req.socket;
  const xForwardedFor = req.headers['x-forwarded-for'];
  console.log('Connection!', xForwardedFor || remoteAddress);

  const notifyClients = (type, game) => {
    wss.clients.forEach((client) => {
      console.log(client !== ws, client.readyState === WebSocket.OPEN, client.currentGame === game);
      if (client !== ws && client.readyState === WebSocket.OPEN && client.currentGame === game) {
        console.log('updating client');
        const socketData = JSON.stringify({
          type,
          game,
        });
        client.send(socketData);
      }
    });
  };

  try {
    const existingData = await ConnectionStore.fetchConnection(
      xForwardedFor || remoteAddress,
    );
    if (existingData) {
      await ConnectionStore.updateConnection(xForwardedFor || remoteAddress);
    } else {
      await ConnectionStore.createConnection(xForwardedFor || remoteAddress);
    }
  } catch (err) {
    console.error(err);
  }

  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async (message) => {
    const msg = JSON.parse(message);
    console.log('Received message', msg.type);

    switch (msg.type) {
      case 'UPDATE':
        console.log('UPDATE');
        notifyClients('UPDATE', msg.game);
        break;
      case 'CREATE':
        console.log('CREATE');
        ws.currentGame = msg.game;
        break;
      case 'JOIN':
        console.log('JOIN');
        ws.currentGame = msg.game;
        await ConnectionStore.updateConnection(
          remoteAddress,
          msg.game,
        );
        break;
      case 'CLEAR':
        console.log('CLEAR');
        delete ws.currentGame;
        break;
      case 'MESSAGE':
        console.log('MESSAGE');
        notifyClients('MESSAGE', msg.game);
        break;
      default:
        console.log('Invalid type');
        break;
    }
  });
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate();
      return;
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});
