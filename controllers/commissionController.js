const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

// Helper — commission calculate karo
const calculateCommission = (amount) => {
  const enabled = process.env.COMMISSION_ENABLED === 'true';
  if (!enabled) return { rate: 0, amount: 0, enabled: false };
  const rate = parseFloat(process.env.COMMISSION_RATE) || 10;
  return {
    rate,
    amount: parseFloat(((amount * rate) / 100).toFixed(2)),
    enabled: true
  };
};

// Worker apna commission status dekhe
exports.getMyCommission = async (req, res) => {
  try {
    const worker = await Worker.findById(req.user._id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    // Pending commission bookings
    const pendingBookings = await Booking.find({
      worker: req.user._id,
      'payment.commissionStatus': 'pending'
    }).populate('customer', 'name phone').sort({ createdAt: -1 });

    // Collected commission bookings
    const collectedBookings = await Booking.find({
      worker: req.user._id,
      'payment.commissionStatus': 'collected'
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          totalPending: worker.commission?.totalPending || 0,
          totalCollected: worker.commission?.totalCollected || 0,
          pendingCount: worker.commission?.pendingCount || 0,
          isBlocked: worker.commission?.isBlocked || false
        },
        pendingBookings,
        collectedBookings,
        commissionEnabled: process.env.COMMISSION_ENABLED === 'true',
        commissionRate: parseFloat(process.env.COMMISSION_RATE) || 10
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

// Worker commission pay kare
exports.payCommission = async (req, res) => {
  try {
    const { bookingId, paymentMethod, upiTransactionId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Sirf apni booking
    if (booking.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Already collected check
    if (booking.payment.commissionStatus === 'collected') {
      return res.status(400).json({ success: false, message: 'Commission already paid' });
    }

    // Commission pending hona chahiye
    if (booking.payment.commissionStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'No commission pending for this booking' });
    }

    // Mark as collected
    booking.payment.commissionStatus = 'collected';
    booking.payment.commissionPaidAt = new Date();
    await booking.save();

    // Transaction update
    await Transaction.findOneAndUpdate(
      { booking: bookingId },
      {
        commissionStatus: 'collected',
        commissionPaidAt: new Date()
      }
    );

    // Worker commission update
    const worker = await Worker.findById(req.user._id);
    worker.commission.totalPending -= booking.payment.commissionAmount;
    worker.commission.totalCollected += booking.payment.commissionAmount;
    worker.commission.pendingCount -= 1;

    // Unblock if pending count <= 3
    if (worker.commission.pendingCount <= 3) {
      worker.commission.isBlocked = false;
    }

    await worker.save();

    res.json({
      success: true,
      message: 'Commission payment recorded successfully',
      data: {
        commissionAmount: booking.payment.commissionAmount,
        pendingCount: worker.commission.pendingCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

// Admin — sabki commission dekhe
exports.getAllCommissions = async (req, res) => {
  try {
    const workers = await Worker.find({
      'commission.totalPending': { $gt: 0 }
    }).select('name phone commission');

    const totalPending = await Booking.aggregate([
      { $match: { 'payment.commissionStatus': 'pending' } },
      { $group: { _id: null, total: { $sum: '$payment.commissionAmount' } } }
    ]);

    const totalCollected = await Booking.aggregate([
      { $match: { 'payment.commissionStatus': 'collected' } },
      { $group: { _id: null, total: { $sum: '$payment.commissionAmount' } } }
    ]);

    const recentTransactions = await Transaction.find({
      commissionAmount: { $gt: 0 }
    })
      .populate('worker', 'name phone')
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        summary: {
          totalPending: totalPending[0]?.total || 0,
          totalCollected: totalCollected[0]?.total || 0
        },
        workersWithPending: workers,
        recentTransactions,
        commissionEnabled: process.env.COMMISSION_ENABLED === 'true',
        commissionRate: parseFloat(process.env.COMMISSION_RATE) || 10
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

// Admin — worker ka commission collected mark kare
exports.adminCollectCommission = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate('worker', 'name');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.payment.commissionStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Commission not pending' });
    }

    booking.payment.commissionStatus = 'collected';
    booking.payment.commissionPaidAt = new Date();
    await booking.save();

    // Worker update
    await Worker.findByIdAndUpdate(booking.worker._id, {
      $inc: {
        'commission.totalPending': -booking.payment.commissionAmount,
        'commission.totalCollected': booking.payment.commissionAmount,
        'commission.pendingCount': -1
      }
    });

    // Unblock check
    const worker = await Worker.findById(booking.worker._id);
    if (worker.commission.pendingCount <= 3 && worker.commission.isBlocked) {
      worker.commission.isBlocked = false;
      await worker.save();
    }

    res.json({
      success: true,
      message: `Commission of ₹${booking.payment.commissionAmount} collected from ${booking.worker.name}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

module.exports.calculateCommission = calculateCommission;