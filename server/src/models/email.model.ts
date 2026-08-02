import mongoose from 'mongoose'

const emailSchema = new mongoose.Schema({
  name: String,
  address: String,
})

const EmailModel = mongoose.model('EmailModel', emailSchema, 'emails')

export default EmailModel
