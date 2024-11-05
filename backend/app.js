// Comment out dotenv for now
// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ownerRoutes = require('./routes/ownerRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = 9000;

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware to parse JSON data
app.use(express.json());

// Use the imported routes
app.use('/api/owner', ownerRoutes);
app.use('/api/user', userRoutes);

// Basic route for testing the server
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;