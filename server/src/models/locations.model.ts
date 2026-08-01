import mongoose from 'mongoose'

const locationSchema = new mongoose.Schema({
  id: String,
  label: String,
  layer: Number,
  isOpen: Boolean,
  editing: Boolean,
  isSelected: Boolean,
  parent: String,
  children: Array,
})

const Location = mongoose.model('Location', locationSchema, 'locations')

export default Location
