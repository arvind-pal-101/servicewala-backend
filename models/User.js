const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    select: false
  },
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  favoriteWorkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  // Image fields (ADD THIS SECTION)
  profileImage: {
    url: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      default: ''
    }
  },
  portfolio: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
}, {
  timestamps: true
});

// Hash password before saving - FIXED VERSION (no next callback)
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);