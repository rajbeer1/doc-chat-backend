const jwt = require('jsonwebtoken');

const generateToken = (userId, userType = 'dummy') => {
  return jwt.sign(
    { 
      id: userId, 
      userType,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    { expiresIn: '30d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
  } catch (error) {
    return null;
  }
};

const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader
}; 