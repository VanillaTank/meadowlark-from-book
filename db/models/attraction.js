const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const attractionSchema = new Schema({
  name: { type: String },
  description: { type: String },
  location: { lat: Number, lng: Number },
  history: {
    event: String,
    notes: String,
    email: String,
    date: Date,
  },
  updateId: String, // ссылка на исходную запись
  approved: Boolean,
})


const Attraction = model('Attraction', attractionSchema);

module.exports = Attraction;
