const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please add a valid 10-digit phone number']
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a service category']
  },
  experience: {
    type: Number,
    required: [true, 'Please add years of experience'],
    min: 0
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Please add hourly rate'],
    min: 0
  },
  location: {
    address: String,
    city: {
      type: String,
      required: true
    },
    state: String,
    pincode: String,
    serviceAreas: [String],
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  profilePic: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  portfolio: [{
    type: String
  }],
  documents: {
    aadhaarNumber: {
      type: String,
      required: [true, 'Aadhaar number is required']
    },
    aadhaarImage: String,
    otherDocs: [String]
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: String
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    schedule: {
      monday: { available: Boolean, slots: [String] },
      tuesday: { available: Boolean, slots: [String] },
      wednesday: { available: Boolean, slots: [String] },
      thursday: { available: Boolean, slots: [String] },
      friday: { available: Boolean, slots: [String] },
      saturday: { available: Boolean, slots: [String] },
      sunday: { available: Boolean, slots: [String] }
    }
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  completedBookings: {
    type: Number,
    default: 0
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    thisMonth: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Geospatial index for location-based search
workerSchema.index({ 'location.coordinates': '2dsphere' });

// Hash password before saving - SINGLE CLEAN VERSION
workerSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method - THIS WAS MISSING!
workerSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Worker', workerSchema);