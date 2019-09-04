const AppError = require('../utils/AppError');

const handleCastErrorDB = err => {
  const message = `GlobalHandler~! Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDupFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `GlobalHandler~! Duplicates: ${value}`;
  return new AppError(message, 400);
};

const handleValidationDB = err => {
  //Objects have keys and values, we'll extract the values below
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `GlobalHandler~! Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = err =>
  new AppError('Blee token. Please login again.', 401);

const handleJWTExpError = err =>
  new AppError('Expired... Please login again.', 401);

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: `GlobalHandler~! ${err.message}`,
      stack: err.stack
    });
  }
  //RENDER
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      //Trusted error:
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    //Unknown errors...
    return res.status(500).json({
      status: 'error',
      message: 'Something is just wrong...'
    });
  }

  if (err.isOperational) {
    //Trusted error:
    res.status(err.statusCode).render('error', {
      title: 'Something just went wrong...',
      msg: err.message
    });
  }
  //Unknown errors...
  return res.status(500).render('error', {
    title: 'Something just went wrong...',
    msg: 'Well, lets try later ~~'
  });
};

module.exports = (err, req, res, next) => {
  //define default
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDupFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError') error = handleJWTExpError(error);
    sendErrorProd(error, req, res);
  }
};
