import mongoose from 'mongoose'

const itemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  room: String,
  location: String,
  expirationDate: Date,
  lowStockAlert: Boolean,
})

const Item = mongoose.model('Item', itemSchema, 'items')

export default Item
