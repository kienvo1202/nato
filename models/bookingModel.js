const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: { type: mongoose.Schema.ObjectId, ref: 'Tour', require: true },
  user: { type: mongoose.Schema.ObjectId, ref: 'User', require: true },
  price: { type: Number, require: true },
  createdAt: { type: Date, default: Date.now() },
  paid: { type: Boolean, default: true }
  //paid is here to manually book a tour for offline users
});
bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name'
  });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
