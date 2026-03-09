const cloudinary = require('../config/cloudinary');
const Worker = require('../models/Worker');

// @desc    Upload profile image
// @route   POST /api/upload/profile
// @access  Private (Worker only)
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get the uploaded image URL from Cloudinary
    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    // Update worker's profile image in database
    const worker = await Worker.findById(req.user._id);
    
    if (!worker) {
      // Delete uploaded image if worker not found
      await cloudinary.uploader.destroy(publicId);
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Delete old profile image from Cloudinary if exists
    if (worker.profileImage && worker.profileImage.publicId) {
      await cloudinary.uploader.destroy(worker.profileImage.publicId);
    }

    // Update worker with new image
    worker.profileImage = {
      url: imageUrl,
      publicId: publicId
    };

    await worker.save();

    res.status(200).json({
      message: 'Profile image uploaded successfully',
      profileImage: worker.profileImage
    });

  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ 
      message: 'Error uploading profile image',
      error: error.message 
    });
  }
};

// @desc    Upload portfolio images
// @route   POST /api/upload/portfolio
// @access  Private (Worker only)
const uploadPortfolioImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const worker = await Worker.findById(req.user._id);
    
    if (!worker) {
      // Delete uploaded images if worker not found
      for (const file of req.files) {
        await cloudinary.uploader.destroy(file.filename);
      }
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Initialize portfolio array if not exists
    if (!worker.portfolio) {
      worker.portfolio = [];
    }

    // Check if adding new images will exceed limit (max 5)
    if (worker.portfolio.length + req.files.length > 5) {
      // Delete newly uploaded images
      for (const file of req.files) {
        await cloudinary.uploader.destroy(file.filename);
      }
      return res.status(400).json({ 
        message: `Portfolio limit exceeded. You can only have 5 images. Currently you have ${worker.portfolio.length}.`
      });
    }

    // Add new images to portfolio
    const newImages = req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    }));

    worker.portfolio.push(...newImages);
    await worker.save();

    res.status(200).json({
      message: 'Portfolio images uploaded successfully',
      portfolio: worker.portfolio
    });

  } catch (error) {
    console.error('Upload portfolio images error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        await cloudinary.uploader.destroy(file.filename);
      }
    }

    res.status(500).json({ 
      message: 'Error uploading portfolio images',
      error: error.message 
    });
  }
};

// @desc    Delete portfolio image
// @route   DELETE /api/upload/portfolio/:publicId
// @access  Private (Worker only)
const deletePortfolioImage = async (req, res) => {
  try {
    const { publicId } = req.params;

    const worker = await Worker.findById(req.user._id);
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Find image in portfolio
    const imageIndex = worker.portfolio.findIndex(
      img => img.publicId === publicId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found in portfolio' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Remove from worker portfolio
    worker.portfolio.splice(imageIndex, 1);
    await worker.save();

    res.status(200).json({
      message: 'Portfolio image deleted successfully',
      portfolio: worker.portfolio
    });

  } catch (error) {
    console.error('Delete portfolio image error:', error);
    res.status(500).json({ 
      message: 'Error deleting portfolio image',
      error: error.message 
    });
  }
};

// @desc    Delete profile image
// @route   DELETE /api/upload/profile
// @access  Private (Worker only)
const deleteProfileImage = async (req, res) => {
  try {
    const worker = await Worker.findById(req.user._id);
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    if (!worker.profileImage || !worker.profileImage.publicId) {
      return res.status(404).json({ message: 'No profile image to delete' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(worker.profileImage.publicId);

    // Remove from worker
    worker.profileImage = undefined;
    await worker.save();

    res.status(200).json({
      message: 'Profile image deleted successfully'
    });

  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({ 
      message: 'Error deleting profile image',
      error: error.message 
    });
  }
};

module.exports = {
  uploadProfileImage,
  uploadPortfolioImages,
  deletePortfolioImage,
  deleteProfileImage
};