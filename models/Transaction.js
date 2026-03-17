const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
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
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['cash', 'online'],
    required: true
  },
  commissionRate: {
    type: Number,
    default: 0
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  commissionStatus: {
    type: String,
    enum: ['not_applicable', 'pending', 'collected'],
    default: 'not_applicable'
  },
  commissionPaidAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);