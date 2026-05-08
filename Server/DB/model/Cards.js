import mongoose from 'mongoose'

const schema = new mongoose.Schema({}, { timestamps: true, strict: false })

class Cards {}

schema.loadClass(Cards)

const model = mongoose.model('cards', schema)

export default model
