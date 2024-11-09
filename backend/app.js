// Comment out dotenv for now
// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ownerRoutes = require('./routes/ownerRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 9000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors({
  origin: [
    'http://k8s-default-frontend-9a8b339ea2-3f40a0d41ad2dad1.elb.us-east-1.amazonaws.com',  // New frontend URL
    'http://k8s-default-frontend-37bb0f2251-d124051f3779fd4d.elb.us-east-1.amazonaws.com',  // Old URL (can remove)
    // Add any other allowed origins
  ],
  credentials: true
}));
// Middleware to parse JSON data
app.use(express.json());

// Use the imported routes
app.use('/api/owner', ownerRoutes);
app.use('/api/user', userRoutes);

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Basic route for testing the server
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});

module.exports = app;