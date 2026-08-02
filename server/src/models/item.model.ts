import mongoose from 'mongoose'

const itemSchema = new mongoose.Schema({
  label: String,
  quantity: Number,
  room: String,
  location: String,
  expirationDate: Date,
  lowStockAlert: Boolean,
})

const ItemModel = mongoose.model('ItemModel', itemSchema, 'items')

export default ItemModel
