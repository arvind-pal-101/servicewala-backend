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

      // Update booking with payment details
      booking.payment = {
        status: 'completed',
        method: 'online',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date()
      };

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
            subject: 'ServiceWala - Payment Successful',
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