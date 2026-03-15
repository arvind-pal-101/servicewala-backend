const setCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,           // HTTPS only in production
    sameSite: isProduction ? 'none' : 'strict',  // 'none' = cross-domain ke liye (Vercel + Render)
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
  
  res.cookie('token', token, cookieOptions);
};

const clearCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    expires: new Date(0),
    path: '/'
  });
};

module.exports = { setCookie, clearCookie };