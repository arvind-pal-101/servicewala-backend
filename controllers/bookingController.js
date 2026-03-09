const Booking = require('../models/Booking');
const User = require('../models/User');
const Worker = require('../models/Worker');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { workerId, categoryId, serviceDetails, scheduledDate, scheduledTime, guestCustomer } = req.body;

    console.log('=== CREATE BOOKING ===');
    console.log('User:', req.user);
    console.log('Body:', req.body);

    // Check if worker exists and is available
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: 'Worker not found' 
      });
    }

    // CRITICAL: Check worker availability
    if (!worker.availability?.isAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: '❌ This worker is currently unavailable. Please try another worker or contact them directly.' 
      });
    }

    // Generate unique booking ID
    const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;

    let customerId;

    // Check if user is logged in
    if (req.user && req.user._id) {
      // Logged-in user
      customerId = req.user._id;
      console.log('Logged-in user booking. Customer ID:', customerId);
    } 
    else if (guestCustomer && guestCustomer.name && guestCustomer.phone) {
      // Guest booking - create temporary customer object
      customerId = {
        name: guestCustomer.name,
        phone: guestCustomer.phone,
        email: guestCustomer.email || ''
      };
      console.log('Guest booking. Customer:', customerId);
    } 
    else {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer information required' 
      });
    }

    // Create booking
    const booking = await Booking.create({
      bookingId,
      customer: customerId,
      worker: workerId,
      category: categoryId,
      serviceDetails,
      scheduledDate,
      scheduledTime,
      status: 'pending',
      timeline: {
        bookedAt: Date.now()
      }
    });

    // Populate references
    await booking.populate('worker category');

    console.log('Booking created successfully:', booking._id);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
};

// Get all bookings for a user
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('worker category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all bookings for a worker
exports.getWorkerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ worker: req.user._id })
      .populate('customer category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching worker bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer worker category');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check authorization
    const isCustomer = booking.customer._id && booking.customer._id.toString() === req.user._id.toString();
    const isWorker = booking.worker && booking.worker._id.toString() === req.user._id.toString();
    
    if (!isCustomer && !isWorker) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Accept booking (worker only)
exports.acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if worker owns this booking
    if (booking.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if booking is pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending bookings can be accepted' 
      });
    }

    booking.status = 'accepted';
    booking.timeline.acceptedAt = Date.now();

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reject booking (worker only)
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if worker owns this booking
    if (booking.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if booking is pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending bookings can be rejected' 
      });
    }

    booking.status = 'rejected';

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking rejected',
      data: booking
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Start service (worker only)
exports.startService = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if worker owns this booking
    if (booking.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if booking is accepted
    if (booking.status !== 'accepted') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only accepted bookings can be started' 
      });
    }

    booking.status = 'in-progress';
    booking.timeline.startedAt = Date.now();

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Service started successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error starting service:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Complete booking (worker only)
exports.completeBooking = async (req, res) => {
  try {
    const { finalAmount } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if worker owns this booking
    if (booking.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if booking is in-progress
    if (booking.status !== 'in-progress') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only in-progress bookings can be completed' 
      });
    }

    booking.status = 'completed';
    booking.timeline.completedAt = Date.now();
    
    if (finalAmount) {
      booking.pricing.finalAmount = finalAmount;
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Service completed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cancel booking (both user and worker)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check authorization
    const isCustomer = booking.customer && booking.customer.toString() === req.user._id.toString();
    const isWorker = booking.worker && booking.worker.toString() === req.user._id.toString();
    
    if (!isCustomer && !isWorker) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Only allow cancellation for pending or accepted bookings
    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel booking at this stage' 
      });
    }

    booking.status = 'cancelled';
    booking.timeline.cancelledAt = Date.now();
    booking.cancellation.reason = req.body.reason || 'Not specified';
    booking.cancellation.cancelledBy = req.user.userType;

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Confirm cash payment received (worker only)
exports.confirmCashPayment = async (req, res) => {
  try {
    console.log('=== CONFIRM CASH PAYMENT ===');
    console.log('User:', req.user);
    console.log('Booking ID:', req.params.id);
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    console.log('Booking worker:', booking.worker);
    console.log('req.user._id:', req.user._id);

    // Only worker can confirm cash
    if (booking.worker.toString() !== req.user._id.toString()) {
      console.log('ERROR: Not authorized - different worker');
      return res.status(403).json({ success: false, message: 'Only worker can confirm cash payment' });
    }

    // Only for completed bookings
    if (booking.status !== 'completed') {
      console.log('ERROR: Booking not completed, status:', booking.status);
      return res.status(400).json({ success: false, message: 'Service must be completed first' });
    }

    // Update payment status
    booking.payment.status = 'completed';
    booking.payment.method = 'cash';
    booking.payment.paidAt = Date.now();

    await booking.save();
    
    console.log('Cash payment confirmed successfully!');

    res.status(200).json({
      success: true,
      message: 'Cash payment confirmed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error confirming cash payment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};