// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware to verify the JWT and attach user info to the request
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).send('Access denied. No token provided.');

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.status(403).send('Invalid token.');
        req.user = user; // Attach the user data to the request
        next();
    });
};

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
