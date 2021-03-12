import http from 'http';
import ws from 'ws';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './server.js';

dotenv.config();

// constants
const PORT = process.env.PORT || 5000;
const DB_URI = process.env.MONGODB_URI;

// create a websocket server
const server = http.createServer(app);
const wsServer = new ws.Server({ server: server, noServer: true });
wsServer.on('close', async () => {
  await mongoose.disconnect();
});

// configure mongoose and connect to database
try {
  mongoose.set('useFindAndModify', false);
  await mongoose.connect(DB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    autoIndex: false,
  });
  const db = mongoose.connection;
  db.watch().on('change', (data) => {
    wsServer.clients.forEach((client) => {
      client.send(JSON.stringify(data));
    });
  });
  console.log('Database connection established.');
} catch (err) {
  console.error(err);
}

// listen for incoming requests
server.listen(PORT, console.log(`Server listening on port ${PORT}.`));
