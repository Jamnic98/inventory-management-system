import mongoose from 'mongoose'

const locationSchema = new mongoose.Schema({
  id: String,
  label: String,
  parent: String,
  children: Array,
})

const LocationModel = mongoose.model('LocationModel', locationSchema, 'locations')

export default LocationModel
