const dotenv = require('dotenv');
const mongoose = require('mongoose');
//console.log(process.env.TEST);
// read env var before app.js
dotenv.config({ path: './config.env' });
console.log(process.env.NODE_ENV);

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  //.connect(process.env.DATABASE_LOCAL, { //connect to local databse
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('DB Connected');
  });
//.catch() to catch login error

const app = require('./app');
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('Heard!');
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  server.close(() => {
    // close server first
    process.exit(1); //when done, call back to shutdown app
  });
});

process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  server.close(() => {
    // close server first
    process.exit(1); //when done, call back to shutdown app
  });
});
//console.log(x);
