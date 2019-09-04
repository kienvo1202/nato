const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Must have name'] },
  email: {
    type: String,
    required: [true, 'Must have email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Invalid email...']
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'lead-guide'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Must have password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Must confirm password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords not the same...'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

//MIDDLEWARE~~~
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 5);
    this.passwordConfirm = undefined;
    if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  }
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //console.log(changedTimeStamp, JWTTimeStamp);
    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  //console.log(resetToken, this.passwordResetToken);
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
