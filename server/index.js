import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './server.js';

dotenv.config();

// constants
const PORT = process.env.PORT || 5000;
const DB_URI = process.env.MONGODB_URI;

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
app.listen(PORT, console.log(`Server listening on port ${PORT}.`));
