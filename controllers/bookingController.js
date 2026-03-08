const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const User = require('../models/User');

const createBooking = async (req, res) => {
  try {
    const { worker, category, serviceDetails, scheduledDate, scheduledTime, guestCustomer } = req.body;

    // Check if worker exists
    const workerExists = await Worker.findById(worker);
    if (!workerExists) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    let customerId = null;
    let isGuestBooking = false;

    // Check if user is logged in (has token)
    if (req.user && req.user._id) {
      // Registered user booking
      customerId = req.user._id;
    } else if (guestCustomer && guestCustomer.name && guestCustomer.phone) {
      // Guest user booking - create temporary user or use guest info
      isGuestBooking = true;
      
      // Check if user with this phone already exists
      let existingUser = await User.findOne({ phone: guestCustomer.phone });
      
      if (existingUser) {
        customerId = existingUser._id;
      } else {
        // Create a guest user account
        const guestUser = await User.create({
          name: guestCustomer.name,
          phone: guestCustomer.phone,
          email: guestCustomer.email || `guest_${guestCustomer.phone}@servicewala.com`,
          password: Math.random().toString(36).slice(-8), // Random password
          location: {
            city: serviceDetails.serviceAddress.city || 'Unknown'
          },
          role: 'user',
          isGuest: true
        });
        customerId = guestUser._id;
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Please login or provide guest details (name, phone)' 
      });
    }

    // Create booking
    const booking = await Booking.create({
      customer: customerId,
      worker,
      category,
      serviceDetails,
      scheduledDate,
      scheduledTime,
      pricing: { 
        estimatedCost: {
          min: workerExists.hourlyRate,
          max: workerExists.hourlyRate * 3
        }
      },
      isGuestBooking
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name phone email')
      .populate('worker', 'name phone')
      .populate('category', 'name icon');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('worker', 'name phone category')
      .populate('category', 'name icon')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWorkerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ worker: req.user._id })
      .populate('customer', 'name phone')
      .populate('category', 'name icon')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('worker', 'name phone')
      .populate('category', 'name icon');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'accepted';
    booking.timeline.acceptedAt = Date.now();
    await booking.save();

    res.json({ success: true, message: 'Booking accepted', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'rejected';
    await booking.save();

    res.json({ success: true, message: 'Booking rejected', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const startService = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'in-progress';
    booking.timeline.startedAt = Date.now();
    await booking.save();

    res.json({ success: true, message: 'Service started', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const completeBooking = async (req, res) => {
  try {
    const { finalAmount } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'completed';
    booking.timeline.completedAt = Date.now();
    booking.pricing.finalAmount = finalAmount;
    
    // Calculate commission (10%)
    const commission = finalAmount * 0.10;
    booking.pricing.platformCommission = commission;
    
    await booking.save();

    // Update worker stats
    await Worker.findByIdAndUpdate(booking.worker, {
      $inc: { 
        completedBookings: 1,
        'earnings.total': finalAmount - commission,
        'earnings.thisMonth': finalAmount - commission
      }
    });

    res.json({ success: true, message: 'Booking completed', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'cancelled';
    booking.timeline.cancelledAt = Date.now();
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getWorkerBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  startService,
  completeBooking,
  cancelBooking
};