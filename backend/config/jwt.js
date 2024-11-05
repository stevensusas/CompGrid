require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'CompGrid_SuperSecretKey_2024';

if (!process.env.JWT_SECRET) {
  console.warn('Warning: Using default JWT secret. Set JWT_SECRET in .env for production.');
}

module.exports = { JWT_SECRET }; 