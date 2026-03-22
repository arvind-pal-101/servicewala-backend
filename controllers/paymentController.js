const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const sendEmail = require('../utils/sendEmail');
const AuditLog = require('../models/AuditLog');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Payment Order
exports.createOrder = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if customer owns this booking
    if (booking.customer.toString() !== (req.user._id || req.user.id).toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
      notes: {
        bookingId: bookingId,
        customerId: req.user.id
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    // Generate signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    const requesterId = (req.user && (req.user._id || req.user.id)) ? (req.user._id || req.user.id).toString() : null;
    const requesterType = req.user?.userType || 'unknown';

    // Verify signature
    if (razorpay_signature === expectedSign) {
      // Payment verified successfully
      const booking = await Booking.findById(bookingId).populate('customer', 'name email');
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Authorization: only booking owner or admin can verify payment
      const bookingCustomerId = booking.customer?._id ? booking.customer._id.toString() : booking.customer?.toString();
      const isOwner = requesterId && bookingCustomerId && requesterId === bookingCustomerId;
      const isAdmin = requesterType === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }

      // Idempotency: if already completed, return success
      if (booking.payment?.status === 'completed' && booking.payment?.razorpayPaymentId === razorpay_payment_id) {
        return res.status(200).json({
          success: true,
          message: 'Payment already verified',
          data: {
            bookingId: booking._id,
            paymentId: razorpay_payment_id
          }
        });
      }

      // Commission calculate karo
const { calculateCommission } = require('./commissionController');
const Transaction = require('../models/Transaction');
const amount = booking.pricing?.finalAmount || 0;
const commission = calculateCommission(amount);

// Update booking with payment + commission details
booking.payment = {
  status: 'completed',
  method: 'online',
  razorpayOrderId: razorpay_order_id,
  razorpayPaymentId: razorpay_payment_id,
  paidAt: new Date(),
  commissionRate: commission.rate,
  commissionAmount: commission.amount,
  commissionStatus: commission.enabled ? 'collected' : 'not_applicable',
  commissionPaidAt: commission.enabled ? new Date() : undefined
};

// Pricing update
booking.pricing.platformCommission = commission.amount;
booking.pricing.workerEarning = amount - commission.amount;

await booking.save();

// Transaction record
if (amount > 0) {
  await Transaction.create({
    booking: booking._id,
    customer: booking.customer._id || booking.customer,
    worker: booking.worker,
    amount,
    method: 'online',
    commissionRate: commission.rate,
    commissionAmount: commission.amount,
    commissionStatus: commission.enabled ? 'collected' : 'not_applicable',
    commissionPaidAt: commission.enabled ? new Date() : undefined
  });
}

// Worker earnings update
// Worker earnings update - Track as PENDING
if (amount > 0) {
  const Worker = require('../models/Worker');
  const workerEarning = amount - commission.amount;
  
  await Worker.findByIdAndUpdate(booking.worker, {
    $inc: {
      'earnings.total': workerEarning,
      'earnings.thisMonth': workerEarning,
      'earnings.pending': workerEarning,  // ← NEW: Add to pending
      'commission.totalCollected': commission.amount
    }
  });
}

// Update booking worker payout status to pending
booking.payment.workerPayoutStatus = 'pending';
await booking.save();

      // Audit log
      try {
        await AuditLog.create({
          actor: req.user?._id,
          actorType: requesterType,
          action: 'payment.verified',
          targetType: 'Booking',
          targetId: booking._id.toString(),
          meta: {
            bookingId: booking.bookingId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id
          }
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError.message);
      }

      // Send payment confirmation email if customer has email
      try {
        const customerEmail = booking.customer?.email;
        if (customerEmail) {
          const message = `
Hello ${booking.customer.name || 'Customer'},

We have successfully received your online payment for your ServiceWala booking.

Booking ID: ${booking.bookingId}
Payment ID: ${razorpay_payment_id}
Amount: This will be reflected in your booking details.

Thank you for trusting ServiceWala.
`.trim();

          await sendEmail({
            email: customerEmail,
            subject: 'ServiceBabu - Payment Successful',
            message
          });
        }
      } catch (emailError) {
        console.error('Payment email error:', emailError.message);
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          bookingId: booking._id,
          paymentId: razorpay_payment_id
        }
      });

    } else {
      // Signature verification failed
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// Get Payment Details
exports.getPaymentDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('customer', 'name email phone')
      .populate('worker', 'name phone')
      .populate('category', 'name icon');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check access
    const userId = (req.user._id || req.user.id).toString();
    if (
      (booking.customer?._id || booking.customer)?.toString() !== userId &&
      (booking.worker?._id || booking.worker)?.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          category: booking.category,
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime
        },
        payment: booking.payment,
        pricing: booking.pricing
      }
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
};

// Refund Payment (Admin/Worker)
exports.refundPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, reason } = req.body;

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!booking.payment || !booking.payment.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'No payment found for this booking'
      });
    }

    // Create refund
    const refund = await razorpay.payments.refund(
      booking.payment.razorpayPaymentId,
      {
        amount: amount * 100, // in paise
        notes: {
          reason: reason || 'Service cancelled',
          bookingId: bookingId
        }
      }
    );

    // Update booking
    booking.payment.status = 'refunded';
    booking.payment.refundId = refund.id;
    booking.payment.refundedAt = new Date();
    booking.payment.refundAmount = amount;

    await booking.save();

    // Audit log
    try {
      await AuditLog.create({
        actor: req.user?._id,
        actorType: req.user?.userType || 'unknown',
        action: 'payment.refunded',
        targetType: 'Booking',
        targetId: booking._id.toString(),
        meta: {
          bookingId: booking.bookingId,
          refundId: refund.id,
          amount,
          reason: reason || 'Service cancelled'
        }
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.id,
        amount: amount
      }
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: error.message
    });
  }
};
// Select Cash Payment Method
exports.selectCashPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if customer owns this booking
    const customerId = booking.customer._id || booking.customer;
    const userId = req.user._id || req.user.id;
    
    if (customerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Set payment method to cash
    booking.payment = {
      method: 'cash',
      status: 'pending'
    };
    
    await booking.save();
    
    // Audit log
    try {
      await AuditLog.create({
        actor: req.user._id,
        actorType: req.user.userType || 'user',
        action: 'payment.cash_selected',
        targetType: 'Booking',
        targetId: booking._id.toString(),
        meta: {
          bookingId: booking.bookingId,
          paymentMethod: 'cash'
        }
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'Cash payment method selected',
      data: booking
    });
    
  } catch (error) {
    console.error('Select cash payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set payment method',
      error: error.message
    });
  }
};

// Mark Worker as Paid (Admin only)
exports.markWorkerPaid = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { payoutMethod, payoutReference } = req.body;

    const booking = await Booking.findById(bookingId).populate('worker', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if payment was completed
    if (booking.payment?.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be completed first'
      });
    }

    // Check if already paid to worker
    if (booking.payment?.workerPayoutStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Worker already paid for this booking'
      });
    }

    const workerEarning = booking.pricing?.workerEarning || 0;

    if (workerEarning <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No worker earning found for this booking'
      });
    }

    // Update booking payout status
    booking.payment.workerPayoutStatus = 'paid';
    booking.payment.workerPaidAt = new Date();
    booking.payment.workerPayoutMethod = payoutMethod || 'upi';
    booking.payment.workerPayoutReference = payoutReference || '';

    await booking.save();

    // Update worker earnings - Move from pending to paid
    const Worker = require('../models/Worker');
    await Worker.findByIdAndUpdate(booking.worker._id, {
      $inc: {
        'earnings.pending': -workerEarning,  // Decrease pending
        'earnings.paid': workerEarning        // Increase paid
      },
      $set: {
        'earnings.lastPayoutDate': new Date()
      }
    });

    // Audit log
    try {
      await AuditLog.create({
        actor: req.user._id,
        actorType: req.user.userType || 'admin',
        action: 'payment.worker_paid',
        targetType: 'Booking',
        targetId: booking._id.toString(),
        meta: {
          bookingId: booking.bookingId,
          workerEarning,
          payoutMethod: payoutMethod || 'upi',
          payoutReference: payoutReference || ''
        }
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Worker payment marked as paid successfully',
      data: {
        bookingId: booking._id,
        workerEarning,
        paidAt: booking.payment.workerPaidAt
      }
    });

  } catch (error) {
    console.error('Mark worker paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark worker payment',
      error: error.message
    });
  }
};

// Get Pending Payouts (Admin only)
exports.getPendingPayouts = async (req, res) => {
  try {
    const Worker = require('../models/Worker');

    // Get all workers with pending earnings > 0
    const workers = await Worker.find({
      'earnings.pending': { $gt: 0 }
    })
    .select('name email phone earnings')
    .lean();

    // Get pending bookings for each worker
    const pendingPayouts = await Promise.all(
      workers.map(async (worker) => {
        const bookings = await Booking.find({
          worker: worker._id,
          'payment.status': 'completed',
          'payment.workerPayoutStatus': 'pending'
        })
        .select('bookingId pricing.workerEarning payment.paidAt')
        .lean();

        return {
          workerId: worker._id,
          workerName: worker.name,
          workerEmail: worker.email,
          workerPhone: worker.phone,
          totalPending: worker.earnings.pending,
          totalPaid: worker.earnings.paid,
          lastPayoutDate: worker.earnings.lastPayoutDate,
          pendingBookings: bookings.map(b => ({
            bookingId: b.bookingId,
            amount: b.pricing?.workerEarning || 0,
            paidAt: b.payment?.paidAt
          }))
        };
      })
    );

    // Sort by total pending (highest first)
    pendingPayouts.sort((a, b) => b.totalPending - a.totalPending);

    res.status(200).json({
      success: true,
      count: pendingPayouts.length,
      data: pendingPayouts
    });

  } catch (error) {
    console.error('Get pending payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payouts',
      error: error.message
    });
  }
};