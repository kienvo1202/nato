const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/APIFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //return updated doc, not the old one
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        newDoc
      }
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    // // clearer alternative?
    // let query = Model.findById(req.params.id);
    // if (populateOptions) query = query.populate(populateOptions);
    // const doc = await query;

    const doc = await Model.findById(req.params.id).populate(populateOptions);
    //findById is just a wrapper, but it's the same as Tour.findOne( {_id: req.params.id} )
    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //this is a hack for reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query; //interesting await a "long" promise
    // const query = Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTimeK,
      result: docs.length,
      data: {
        docs
      }
    });
  });
