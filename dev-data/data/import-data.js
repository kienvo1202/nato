const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: `${__dirname}/../../config.env` });
console.log(process.env.DATABASE);
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('DB Connected');
  });

//READ JSON
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//IMPORT to DB
const importData = async () => {
  try {
    await Tour.create(tours); //create can be use for an array of objects
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data loaded!', reviews);
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Del all');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

console.log(process.argv);
if (process.argv[2] === '--import') {
  importData();
}
if (process.argv[2] === '--delete') {
  deleteData();
}
