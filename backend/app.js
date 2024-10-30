require('dotenv').config();  // Load environment variables
const { authenticateToken, authenticateOwner, authenticateUser } = require('./authMiddleware');
const axios = require('axios');  // Import axios for making HTTP requests

const express = require('express');
const { Pool } = require('pg');  // Import the PostgreSQL client

const app = express();
const PORT = 3000;

// Set up the PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware to parse JSON data
app.use(express.json());

// Test database connection
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');  // Simple query
    res.json({ message: "Database connected", timestamp: result.rows[0].now });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// register instance (Owner)
app.post('/instances', authenticateToken, authenticateOwner, async (req, res) => {
  const { systemType, cpuCoreCount, storage, memory, ipAddress, priceTierId } = req.body;
  try {
      await pool.query(`
          INSERT INTO Instance (SystemType, CPUCoreCount, Storage, Memory, IPAddress, Username, Password, PriceTierId, Booted) 
          VALUES ($1, $2, $3, $4, $5, 'root', 'root', $6, FALSE)
      `, [systemType, cpuCoreCount, storage, memory, ipAddress, priceTierId]);
      res.status(201).send('Instance added successfully');
  } catch (error) {
      res.status(500).send('Error adding instance');
  }
});

// delete instance (Owner)
app.delete('/instances/:id', authenticateToken, authenticateOwner, async (req, res) => {
  const instanceId = req.params.id;
  try {
      await pool.query('DELETE FROM Instance WHERE InstanceId = $1', [instanceId]);
      res.status(200).send('Instance removed successfully');
  } catch (error) {
      res.status(500).send('Error removing instance');
  }
});

// request instance (User)
app.post('/instances/:id/request', authenticateToken, authenticateUser, async (req, res) => {
  const instanceId = req.params.id;
  const userId = req.user.userId; // from JWT
  try {
      await pool.query('UPDATE Instance SET AllocatedUserId = $1 WHERE InstanceId = $2', [userId, instanceId]);
      res.status(200).send('Instance requested successfully');
  } catch (error) {
      res.status(500).send('Error requesting instance');
  }
});

// start instance (User)
app.post('/instances/:id/start', authenticateToken, authenticateUser, async (req, res) => {
  const instanceId = req.params.id;

  try {
    // Fetch the VM name from the database (replace 'VMNameColumn' with the actual column name for VM names)
    const result = await pool.query('SELECT VMNameColumn FROM Instance WHERE InstanceId = $1', [instanceId]);
    const vmName = result.rows[0].vm_name; // assuming the VM name is stored in this column

    if (!vmName) {
      return res.status(404).send('VM name not found');
    }

    // Call the Flask /start-machine endpoint via Ngrok
    const response = await axios.post('https://causal-tight-escargot.ngrok-free.app/start-machine', {
      vm_name: vmName
    });

    if (response.data.status === "success") {
      // Update database to reflect that the instance is booted
      await pool.query('UPDATE Instance SET Booted = TRUE WHERE InstanceId = $1', [instanceId]);
      res.status(200).send('Instance started successfully');
    } else {
      res.status(500).send(`Error starting instance: ${response.data.message}`);
    }
  } catch (error) {
    console.error("Error starting instance:", error);
    res.status(500).send('Error starting instance');
  }
});

// stop instance (User)
app.post('/instances/:id/stop', authenticateToken, authenticateUser, async (req, res) => {
  const instanceId = req.params.id;
  const stopType = req.body.stop_type || "stop";  // Default to "stop" if not provided

  try {
    // Fetch the VM name from the database (replace 'VMNameColumn' with the actual column name for VM names)
    const result = await pool.query('SELECT VMNameColumn FROM Instance WHERE InstanceId = $1', [instanceId]);
    const vmName = result.rows[0].vm_name; // assuming the VM name is stored in this column

    if (!vmName) {
      return res.status(404).send('VM name not found');
    }

    // Call the Flask /stop-machine endpoint via Ngrok
    const response = await axios.post('https://causal-tight-escargot.ngrok-free.app/stop-machine', {
      vm_name: vmName,
      stop_type: stopType
    });

    if (response.data.status === "success") {
      // Update database to reflect that the instance is stopped
      await pool.query('UPDATE Instance SET Booted = FALSE WHERE InstanceId = $1', [instanceId]);
      res.status(200).send('Instance stopped successfully');
    } else {
      res.status(500).send(`Error stopping instance: ${response.data.message}`);
    }
  } catch (error) {
    console.error("Error stopping instance:", error);
    res.status(500).send('Error stopping instance');
  }
});

// Basic route for testing the server
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
