const slugify = require('slugify');
const mongoose = require('mongoose');
const validator = require('validator');
//const User = require('./userModel');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Must have'],
      unique: true,
      trim: true,
      minlength: [10, 'Min10'],
      maxlength: [50, 'Max50']
      //validate: [validator.isAlpha,'Only characters']
    },
    duration: { type: Number, required: [true, 'Must have'] },
    maxGroupSize: { type: Number, required: [true, 'Must have'] },
    difficulty: {
      type: String,
      required: [true, 'Must have'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'only 3 types allowed'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Min1'],
      max: [5, 'Max5'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'Must have'] },
    priceDiscount: {
      type: Number,
      validate: {
        //this. only points to current doc on NEW creation,
        //so this wont work on update
        validator: function(val) {
          return val < this.price;
        },
        message: 'Discount ({VALUE}) > price'
        //mongoose trick with ({})
      }
    },
    summary: { type: String, trim: true, required: [true, 'Must have'] },
    description: { type: String, trim: true },
    imageCover: { type: String, required: [true, 'Must have'] },
    images: [String],
    createdAt: { type: Date, default: Date.now() },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});
//Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //linked field name in  review Model
  localField: '_id' //linked field name in tour Model
});

//DOCUMENT MIDDLEWARE: runs before .save() & .create(), modify body document of request
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//// Embedding data example
// tourSchema.pre('save', async function(next) {
//   const guidePromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidePromises);
//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log('Do more things here...');
//   next();
// });
// tourSchema.post('save', function(doc, next) {
//   console.log(doc); // doc here is the body doc of response
//   next();
// });

//QUERY MIDDLEWARE, before any .find(), modify query
tourSchema.pre(/^find/, function(next) {
  //works for both find & findOne
  //tourSchema.pre('find', function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: 'name email role photo -_id'
  });
  next();
});

tourSchema.post(/^find/, function(doc, next) {
  console.log(`Query took ${Date.now() - this.start} ms`);
  //console.log(doc); // doc here is the body doc of response
  next();
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
