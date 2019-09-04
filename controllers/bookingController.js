const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1. Get booked tour
  const tour = await Tour.findById(req.params.tourId);
  console.log(process.env.STRIPE_SECRET_KEY);
  //2.create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: tour.name,
        description: tour.summary,
        images: [
          'https://salt.tikicdn.com/ts/banner/33/ba/89/54c02d2475983f93a024c0cd13f238e4.png'
        ],
        amount: tour.price * 100, //in cents
        currency: 'usd',
        quantity: 1
      }
    ]
  });
  //3 respond with session
  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  next();
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
