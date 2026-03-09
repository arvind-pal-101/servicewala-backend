const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  serviceDetails: {
    problemDescription: {
      type: String,
      required: [true, 'Please describe the problem']
    },
    serviceAddress: {
      address: String,
      city: String,
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true,
    enum: ['morning', 'afternoon', 'evening']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  pricing: {
    estimatedCost: {
      min: Number,
      max: Number
    },
    finalAmount: Number,
    platformCommission: Number,
    workerEarning: Number
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'online', 'upi', 'card', 'wallet'],
      default: 'cash'
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    refundId: String,
    refundAmount: Number,
    paidAt: Date,
    refundedAt: Date
  },
  timeline: {
    bookedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: Date,
    rejectedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date
  },
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['customer', 'worker', 'admin']
    },
    reason: String,
    cancelledAt: Date
  },
  workPhotos: {
    before: [String],
    after: [String]
  },
  notes: {
    customerNotes: String,
    workerNotes: String,
    adminNotes: String
  },
  isGuestBooking: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate booking ID
bookingSchema.pre('save', async function() {
  if (!this.bookingId) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingId = `BK${Date.now()}${count + 1}`;
  }
});

module.exports = mongoose.model('Booking', bookingSchema);