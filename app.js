// EXPRESS APP, HANDLE ROUTES REQUESTS
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1.GLOBAL MIDDLEWARE
// Set secured http header
app.use(helmet());

// log dev info
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit request
const limiter = rateLimit({
  max: 100,
  windowMs: 3600000,
  message: 'Limited. Too many requests...'
});
app.use('/api', limiter);

// body parse, reading data from body
app.use(express.json({ limit: '10kb' })); //middleware~~, enables access to req.body, limit to avoid security issues
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //access to req.body from HTML form submission
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); //enables access to static file in a folder

//data sanitization
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: 'duration' }));

app.use((req, res, next) => {
  console.log('Hi from Middle');
  next();
});

app.use((req, res, next) => {
  req.requestTimeK = new Date().toISOString();
  //console.log(req.headers);
  next();
});

// TEMPLATE
// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'First get and send, yayy!!!', app: 'Natour!' });
// });
// app.post('/', (req, res) => {
//   res.send('Postable~~~');
// });

//2.THE ROUTE HANDLE
// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id/', getTour);
// app.post('/api/v1/tours', createTour );
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//3. ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Route handling
app.all('*', (req, res, next) => {
  //Final
  next(new AppError(`Cant find ${req.originalUrl} on this server!`, 404));

  //Approach 1
  // res.status(404).json({
  //   status: 'Fail',
  //   message: `Cant find ${req.originalUrl} on this server!`
  // });

  //Approach 2
  // const err = new Error(`Cant find ${req.originalUrl} on this server!`);
  // err.status = 'Fail';
  // err.statusCode = 404;
  // next(err);
  //whatever passed into next is assumed to be an error,
  //other middlewares will be skipped
});

//centralized error handling
app.use(globalErrorHandler);

//4. START SERVER
module.exports = app;
