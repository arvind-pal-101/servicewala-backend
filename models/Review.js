const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true // Ek booking pe sirf ek review
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
  rating: {
    type: Number,
    required: [true, 'Please add a rating'],
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    maxlength: 500
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Review save hone ke baad worker ki average rating update karo
reviewSchema.post('save', async function() {
  const Worker = mongoose.model('Worker');
  
  // Calculate average rating
  const stats = await this.model('Review').aggregate([
    { $match: { worker: this.worker } },
    {
      $group: {
        _id: '$worker',
        avgRating: { $avg: '$rating' },
        numRatings: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Worker.findByIdAndUpdate(this.worker, {
      'ratings.average': stats[0].avgRating.toFixed(1),
      'ratings.count': stats[0].numRatings
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);