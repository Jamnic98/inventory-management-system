import express from 'express';
import cors from 'cors';
import currentItems from './routes/current-items.js';
import previousItems from './routes/previous-items.js';

// express configuration
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/current-items', currentItems);
app.use('/previous-items', previousItems);

export default app;
