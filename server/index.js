import http from 'http';
import ws from 'ws';
import mongoose from 'mongoose';
import app from './server.js';
import sendMessage from './emailer.js';
import dotenv from 'dotenv';
dotenv.config();

// constants
const PORT = process.env.PORT || 8080;
const DB_URI = process.env.MONGODB_URI;

// create a websocket server
const server = http.createServer(app);
const wsServer = new ws.Server({ server });
wsServer.on('close', async () => {
  await mongoose.disconnect();
});

wsServer.on('connection', (ws) => {
  console.log('web socket connected');
  ws.on('message', (message) => {
    wsServer.clients.forEach((client) => {
      const messageObj = JSON.parse(message);
      const { type } = messageObj;
      switch (type) {
        case 'add':
        case 'delete':
        case 'update':
          if (client !== ws && client.readyState === 1) {
            client.send('');
          }
          break;
        case 'email':
          const { subject, content, recipients } = messageObj;
          sendMessage(subject, content, recipients);
          break;
        default:
          break;
      }
    });
  });
});

// configure mongoose and connect to database
try {
  mongoose.set('useFindAndModify', false);
  await mongoose.connect(DB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    autoIndex: false,
  });
  console.log('Database connection established.');
} catch (err) {
  console.error(err);
}

// listen for incoming requests
server.listen(PORT, console.log(`Server listening on port ${PORT}.`));
