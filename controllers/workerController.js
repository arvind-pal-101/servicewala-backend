const Worker = require('../models/Worker');

const searchWorkers = async (req, res) => {
  try {
    const { category, city, minRating, maxRate } = req.query;
    
    let query = {
      isActive: true,
      'verification.status': 'approved'
    };

    if (category) query.category = category;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (minRating) query['ratings.average'] = { $gte: parseFloat(minRating) };
    if (maxRate) query.hourlyRate = { $lte: parseFloat(maxRate) };

    const workers = await Worker.find(query)
      .populate('category', 'name icon')
      .select('-password -documents.aadhaarNumber')
      .sort({ 'ratings.average': -1 });

    res.json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('category', 'name icon description')
      .select('-password -documents.aadhaarNumber');

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    res.json({
      success: true,
      data: worker
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllWorkers = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};

    if (status) query['verification.status'] = status;

    const workers = await Worker.find(query)
      .populate('category', 'name icon')
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Worker.countDocuments(query);

    res.json({
      success: true,
      count: workers.length,
      totalPages: Math.ceil(count / limit),
      data: workers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const verifyWorker = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    worker.verification.status = status;
    
    if (status === 'approved') {
      worker.verification.isVerified = true;
      worker.verification.verifiedAt = Date.now();
      worker.verification.verifiedBy = req.user._id;
    } else if (status === 'rejected') {
      worker.verification.rejectionReason = rejectionReason;
    }

    await worker.save();

    res.json({
      success: true,
      message: `Worker ${status} successfully`,
      data: worker
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  searchWorkers,
  getWorkerById,
  getAllWorkers,
  verifyWorker
};