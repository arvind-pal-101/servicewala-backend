// Set HTTP-only cookie with secure configuration
const setCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,  // Cannot be accessed by JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',  // 'lax' needed when frontend (Vercel) and backend (Render) are different domains
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
    path: '/'  // Cookie available for all routes
  };
  
  res.cookie('token', token, cookieOptions);
};

// Clear cookie on logout
const clearCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),  // Expire immediately
    path: '/'
  });
};

module.exports = { setCookie, clearCookie };