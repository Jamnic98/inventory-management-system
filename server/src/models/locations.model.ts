import mongoose from 'mongoose'

const locationSchema = new mongoose.Schema({
  id: String,
  label: String,
  parent: String,
  children: Array,
})

const Location = mongoose.model('Location', locationSchema, 'locations')

export default Location
