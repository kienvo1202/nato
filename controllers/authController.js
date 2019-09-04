const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Email = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 3600000
    ),
    httpOnly: true //cookie cannot be modified by the browser, only store and send
  };
  //secure = httpS encrypted connection, only works for production
  if (process.env.ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  //pass already stored in database, now remove it from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    date: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //check email&pass input
  if (!email || !password) {
    return next(new AppError('Need both email&pass...', 400));
  }
  //check email&pass correct
  const user = await User.findOne({ email: email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Email or Pass is wrong...', 401));
  }
  //send token
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1.Get token
  console.log('Protect Middleware');
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('authCon unauthorized access!?', 401));
  }
  //2. Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3. Check if user exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('User deleted!?', 401));
  }
  //4. Check for changed password, after issued token
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Pass changed already??', 401));
  }

  //If there is no error so far, go next to grant access to data
  console.log('Protect Middleware');
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

//for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (!req.cookies.jwt) return next();
    //2. Verify token
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );
    //3. Check if user exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) return next();
    //4. Check for changed password, after issued token
    if (freshUser.changedPasswordAfter(decoded.iat)) return next();
    //If there is no error so far, go next to grant access to data

    res.locals.user = freshUser;
    next();
  } catch (err) {
    next();
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('No Permission', 403));
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //find user email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('Email not found', 404));
  }
  //generate random token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  // const message = `Click this link ${resetURL} or just ignore~~`;

  //send token to user email
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Password reset token here! (10min)',
    //   message: message
    // });
    await new Email(user, resetURL).sendResetPass();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email.'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('Error while sending token. Unsuccessful...', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  //if token has not expired & user exists, set password
  if (!user) {
    return next(new AppError('Token mehh...', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //update changedPass property

  //log user in
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //find user
  const user = await User.findById({ _id: req.user.id }).select('+password');
  //check if current password matches
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Wrong email or pass..', 400));
  }
  //update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //log in
  createSendToken(user, 200, res);
});
