const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const orderSchema = new Schema({
  /* TODO */
});
const Order = model('Order', orderSchema);
module.exports = Order;
