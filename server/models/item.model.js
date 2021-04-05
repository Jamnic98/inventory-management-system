import mongoose from 'mongoose';

const itemSchema = mongoose.Schema({
  name: String,
  quantity: Number,
  room: String,
  location: String,
  expirationDate: Date,
  lowStockAlert: Boolean,
});

export const CurrentItem = mongoose.model(
  'CurrentItem',
  itemSchema,
  'current_items'
);
