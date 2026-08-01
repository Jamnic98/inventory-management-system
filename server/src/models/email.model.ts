import mongoose from 'mongoose'

const emailSchema = new mongoose.Schema({
  name: String,
  address: String,
})

const Email = mongoose.model('Email', emailSchema, 'emails')

export default Email
