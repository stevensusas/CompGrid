const express = require('express');
const axios = require('axios');
const { authenticateToken, authenticateUser } = require('../authMiddleware');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool();  // Assuming database configuration is in environment variables

// Request instance
router.post('/instances/:id/request', authenticateToken, authenticateUser, async (req, res) => {
  const instanceId = req.params.id;
  const userId = req.user.userId; // from JWT
  try {
    await pool.query('UPDATE Instance SET AllocatedUserId = $1 WHERE InstanceId = $2', [userId, instanceId]);
    res.status(200).send('Instance requested successfully');
  } catch (error) {
    res.status(500).send('Error requesting instance');
  }
});

// Start instance
router.post('/instances/:id/start', authenticateToken, authenticateUser, async (req, res) => {
  const instanceId = req.params.id;
  try {
    const result = await pool.query('SELECT VMNameColumn FROM Instance WHERE InstanceId = $1', [instanceId]);
    const vmName = result.rows[0].vm_name;

    if (!vmName) {
      return res.status(404).send('VM name not found');
    }

    const response = await axios.post('https://causal-tight-escargot.ngrok-free.app/start-machine', {
      vm_name: vmName
    });

    if (response.data.status === "success") {
      await pool.query('UPDATE Instance SET Booted = TRUE WHERE InstanceId = $1', [instanceId]);
      res.status(200).send('Instance started successfully');
    } else {
      res.status(500).send(`Error starting instance: ${response.data.message}`);
    }
  } catch (error) {
    res.status(500).send('Error starting instance');
  }
});

// Stop instance
router.post('/instances/:id/stop', authenticateToken, authenticateUser, async (req, res) => {
  const instanceId = req.params.id;
  const stopType = req.body.stop_type || "stop";

  try {
    const result = await pool.query('SELECT VMNameColumn FROM Instance WHERE InstanceId = $1', [instanceId]);
    const vmName = result.rows[0].vm_name;

    if (!vmName) {
      return res.status(404).send('VM name not found');
    }

    const response = await axios.post('https://causal-tight-escargot.ngrok-free.app/stop-machine', {
      vm_name: vmName,
      stop_type: stopType
    });

    if (response.data.status === "success") {
      await pool.query('UPDATE Instance SET Booted = FALSE WHERE InstanceId = $1', [instanceId]);
      res.status(200).send('Instance stopped successfully');
    } else {
      res.status(500).send(`Error stopping instance: ${response.data.message}`);
    }
  } catch (error) {
    res.status(500).send('Error stopping instance');
  }
});

module.exports = router;
