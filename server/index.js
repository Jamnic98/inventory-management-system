import http from 'http';
import ws from 'ws';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './server.js';

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
  ws.on('message', () => {
    wsServer.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send();
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
