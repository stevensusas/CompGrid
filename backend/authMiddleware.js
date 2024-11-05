require('dotenv').config();
const jwt = require('jsonwebtoken');

// Use the same hardcoded secret
const JWT_SECRET = 'CompGrid_SuperSecretKey_2024';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    console.log('Decoded token:', decoded);
    
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
  });
};

module.exports = { authenticateToken };

// Middleware to allow only cluster owners
const authenticateOwner = (req, res, next) => {
    if (req.user.role === 'owner') {
        next();
    } else {
        res.status(403).send('Access denied. Only cluster owners are allowed.');
    }
};

// Middleware to allow only cluster users
const authenticateUser = (req, res, next) => {
    if (req.user.role === 'user') {
        next();
    } else {
        res.status(403).send('Access denied. Only cluster users are allowed.');
    }
};

module.exports = { authenticateToken, authenticateOwner, authenticateUser };
