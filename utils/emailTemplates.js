/**
 * Email Templates for Booking Notifications
 */

// Template for new booking notification to worker
exports.newBookingTemplate = (booking) => {
  const bookedDate = new Date(booking.scheduledDate).toLocaleDateString('en-IN');
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🔔 New Booking Request!</h1>
      </div>
      
      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #2d3748;">Hello ${booking.worker?.name || 'Partner'},</p>
        
        <p style="font-size: 16px; color: #2d3748;">You have received a new booking request on ServiceBabu!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #2d3748;">📋 Booking Details:</h3>
          <p style="margin: 8px 0;"><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p style="margin: 8px 0;"><strong>Customer:</strong> ${booking.customer?.name || 'Customer'}</p>
          <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.category?.name || 'Service'}</p>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${bookedDate}</p>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${booking.scheduledTime}</p>
          <p style="margin: 8px 0;"><strong>Duration:</strong> ${booking.serviceDetails?.hours || 'N/A'} hours</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/worker/dashboard" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View & Respond to Booking
          </a>
        </div>
        
        <p style="font-size: 14px; color: #718096; margin-top: 20px;">
          ⏰ Please respond to this booking request as soon as possible.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">
          ServiceBabu - Your trusted service platform
        </p>
      </div>
    </div>
  `;
};

// Template for booking accepted notification to customer
exports.bookingAcceptedTemplate = (booking) => {
  const bookedDate = new Date(booking.scheduledDate).toLocaleDateString('en-IN');
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✅ Booking Confirmed!</h1>
      </div>
      
      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #2d3748;">Hello ${booking.customer?.name || 'Customer'},</p>
        
        <p style="font-size: 16px; color: #2d3748;">Great news! Your booking has been confirmed by the service provider.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48bb78;">
          <h3 style="margin-top: 0; color: #2d3748;">📋 Booking Details:</h3>
          <p style="margin: 8px 0;"><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p style="margin: 8px 0;"><strong>Service Provider:</strong> ${booking.worker?.name || 'Provider'}</p>
          <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.category?.name || 'Service'}</p>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${bookedDate}</p>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${booking.scheduledTime}</p>
        </div>
        
        <div style="background: #ebf8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #2c5282;">
            📞 <strong>Next Steps:</strong><br>
            The service provider will arrive at your location on the scheduled date and time. 
            Please ensure you're available.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #48bb78; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View Booking Details
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">
          ServiceBabu - Your trusted service platform
        </p>
      </div>
    </div>
  `;
};

// Template for booking rejected notification to customer
exports.bookingRejectedTemplate = (booking) => {
  const bookedDate = new Date(booking.scheduledDate).toLocaleDateString('en-IN');
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f56565 0%, #c53030 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">❌ Booking Not Available</h1>
      </div>
      
      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #2d3748;">Hello ${booking.customer?.name || 'Customer'},</p>
        
        <p style="font-size: 16px; color: #2d3748;">Unfortunately, ${booking.worker?.name || 'the service provider'} is not available for your requested booking.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f56565;">
          <h3 style="margin-top: 0; color: #2d3748;">📋 Booking Details:</h3>
          <p style="margin: 8px 0;"><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.category?.name || 'Service'}</p>
          <p style="margin: 8px 0;"><strong>Requested Date:</strong> ${bookedDate}</p>
          <p style="margin: 8px 0;"><strong>Requested Time:</strong> ${booking.scheduledTime}</p>
        </div>
        
        <div style="background: #fef5e7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #744210;">
            💡 <strong>Don't worry!</strong> You can:<br>
            • Try booking with another service provider<br>
            • Choose a different time slot<br>
            • Contact us for assistance
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/services" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Find Other Providers
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">
          ServiceBabu - Your trusted service platform
        </p>
      </div>
    </div>
  `;
};

// Template for service started notification to customer
exports.serviceStartedTemplate = (booking) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🚀 Service Started!</h1>
      </div>
      
      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #2d3748;">Hello ${booking.customer?.name || 'Customer'},</p>
        
        <p style="font-size: 16px; color: #2d3748;">${booking.worker?.name || 'The service provider'} has started working on your service.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4299e1;">
          <h3 style="margin-top: 0; color: #2d3748;">📋 Service Details:</h3>
          <p style="margin: 8px 0;"><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p style="margin: 8px 0;"><strong>Service Provider:</strong> ${booking.worker?.name || 'Provider'}</p>
          <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.category?.name || 'Service'}</p>
          <p style="margin: 8px 0;"><strong>Started At:</strong> ${new Date(booking.timeline?.startedAt).toLocaleString('en-IN')}</p>
        </div>
        
        <div style="background: #e6fffa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #234e52;">
            ⏱️ The service is now in progress. You'll be notified once it's completed.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #4299e1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View Booking Status
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">
          ServiceBabu - Your trusted service platform
        </p>
      </div>
    </div>
  `;
};

// Template for service completed notification to customer
exports.serviceCompletedTemplate = (booking) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✅ Service Completed!</h1>
      </div>
      
      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #2d3748;">Hello ${booking.customer?.name || 'Customer'},</p>
        
        <p style="font-size: 16px; color: #2d3748;">Your service has been completed successfully!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9f7aea;">
          <h3 style="margin-top: 0; color: #2d3748;">📋 Service Summary:</h3>
          <p style="margin: 8px 0;"><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p style="margin: 8px 0;"><strong>Service Provider:</strong> ${booking.worker?.name || 'Provider'}</p>
          <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.category?.name || 'Service'}</p>
          <p style="margin: 8px 0;"><strong>Completed At:</strong> ${new Date(booking.timeline?.completedAt).toLocaleString('en-IN')}</p>
        </div>
        
        <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #2d3748;">⭐ Rate Your Experience</h3>
          <p style="margin: 10px 0; font-size: 14px; color: #4a5568;">
            Help others by sharing your experience!
          </p>
          <a href="${process.env.FRONTEND_URL}/booking/${booking._id}" 
             style="background: #9f7aea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin-top: 10px;">
            Leave a Review
          </a>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View Booking Details
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">
          ServiceBabu - Your trusted service platform<br>
          Thank you for using our services!
        </p>
      </div>
    </div>
  `;
};