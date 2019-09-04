const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getOverview = catchAsync(async (req, res, next) => {
  //Get data
  const tours = await Tour.find();
  //build template

  //Render template with data
  res.status(200).render('overview', {
    title: 'test overview! kaka',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  console.log(!tour);
  if (!tour) {
    console.log('3213');
    return next(new AppError('Tour not found...', 404));
  }

  res.status(200).render('tour', {
    title: tour.name,
    tour
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  //find bookings
  const bookings = await Booking.find({ user: req.user.id });
  //find tours from bookings

  const tourIDs = bookings.map(el => el.tour);
  let tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My booking',
    data: tours
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login page',
    data: null
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Account'
  });
};
