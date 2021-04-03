import express from 'express';
import cors from 'cors';
import currentItems from './routes/current-items.js';
import previousItems from './routes/previous-items.js';
import emails from './routes/emails.js';
import roomsAndLocations from './routes/rooms-and-locations.js';

// express configuration
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/current-items', currentItems);
app.use('/previous-items', previousItems);
app.use('/emails', emails);
app.use('/rooms-and-locations', roomsAndLocations);

export default app;
