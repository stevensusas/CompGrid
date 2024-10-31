const express = require('express');
const { authenticateToken, authenticateUser } = require('../authMiddleware');
const axios = require('axios');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool();

// Request instance by instance type
router.post('/instances/request', authenticateToken, authenticateUser, async (req, res) => {
  const { instanceType } = req.body;
  const userId = req.user.userId; // from JWT

  try {
    // Step 1: Find an available instance of the requested instance type
    const instanceCheck = await pool.query(`
      SELECT InstanceId FROM Instance
      WHERE InstanceTypeId = (
        SELECT InstanceTypeId FROM InstanceType WHERE InstanceType = $1
      ) AND AllocatedUserId IS NULL
      LIMIT 1
    `, [instanceType]);

    // Step 2: Check if any available instance was found
    if (instanceCheck.rowCount === 0) {
      return res.status(404).send('No available instances of the requested type');
    }

    const instanceId = instanceCheck.rows[0].instanceid;

    // Step 3: Allocate the instance to the user
    await pool.query('UPDATE Instance SET AllocatedUserId = $1 WHERE InstanceId = $2', [userId, instanceId]);

    res.status(200).send(`Instance of type ${instanceType} allocated successfully`);
  } catch (error) {
    console.error('Error requesting instance:', error);
    res.status(500).send('Error requesting instance');
  }
});

// Start instance by instance ID
router.post('/instances/:id/start', authenticateToken, authenticateUser, async (req, res) => {
  const instanceId = req.params.id;

  try {
    // Check if the instance exists and get its booted status
    const result = await pool.query('SELECT Booted FROM Instance WHERE InstanceId = $1', [instanceId]);

    if (result.rowCount === 0) {
      return res.status(404).send('Instance not found');
    }

    const isBooted = result.rows[0].booted;
    if (isBooted) {
      return res.status(400).send('Instance is already started');
    }

    // Call the Flask API to start the instance
    const response = await axios.post('https://causal-tight-escargot.ngrok-free.app/start-machine', {
      vm_name: instanceId  // Pass instanceId if it's used as the identifier in the Flask API
    });

    if (response.data.status === "success") {
      // Update the instance to reflect that it is booted
      await pool.query('UPDATE Instance SET Booted = TRUE WHERE InstanceId = $1', [instanceId]);
      res.status(200).send('Instance started successfully');
    } else {
      res.status(500).send(`Error starting instance: ${response.data.message}`);
    }
  } catch (error) {
    console.error('Error starting instance:', error);
    res.status(500).send('Error starting instance');
  }
});

// Stop instance by instance ID
router.post('/instances/:id/stop', authenticateToken, authenticateUser, async (req, res) => {
  const instanceId = req.params.id;
  const stopType = req.body.stop_type || "stop";

  try {
    // Check if the instance exists and get its booted status
    const result = await pool.query('SELECT Booted FROM Instance WHERE InstanceId = $1', [instanceId]);

    if (result.rowCount === 0) {
      return res.status(404).send('Instance not found');
    }

    const isBooted = result.rows[0].booted;
    if (!isBooted) {
      return res.status(400).send('Instance is already stopped');
    }

    // Call the Flask API to stop the instance
    const response = await axios.post('https://causal-tight-escargot.ngrok-free.app/stop-machine', {
      vm_name: instanceId, // Pass instanceId as the identifier for the Flask API
      stop_type: stopType
    });

    if (response.data.status === "success") {
      // Update the instance to reflect that it is no longer booted
      await pool.query('UPDATE Instance SET Booted = FALSE WHERE InstanceId = $1', [instanceId]);
      res.status(200).send('Instance stopped successfully');
    } else {
      res.status(500).send(`Error stopping instance: ${response.data.message}`);
    }
  } catch (error) {
    console.error('Error stopping instance:', error);
    res.status(500).send('Error stopping instance');
  }
});

// Deallocate instance by instance ID
router.post('/instances/:id/deallocate', authenticateToken, authenticateUser, async (req, res) => {
  const instanceId = req.params.id;
  const userId = req.user.userId; // from JWT

  try {
    // Step 1: Check if the instance exists, is allocated to this user, and get its booted status
    const instanceCheck = await pool.query(`
      SELECT AllocatedUserId, Booted FROM Instance WHERE InstanceId = $1
    `, [instanceId]);

    if (instanceCheck.rowCount === 0) {
      return res.status(404).send('Instance not found');
    }

    const { allocateduserid, booted } = instanceCheck.rows[0];

    // Check if the instance is allocated to this user
    if (allocateduserid !== userId) {
      return res.status(403).send('You do not have permission to deallocate this instance');
    }

    // Step 2: Reset the machine if it is booted
    if (booted) {
      const resetResponse = await axios.post('http://localhost:5000/reset-machine', {
        vm_name: instanceId  // Assuming `reset-machine` endpoint expects `vm_name` to be the instance ID
      });

      if (resetResponse.data.status !== "success") {
        return res.status(500).send(`Error resetting instance: ${resetResponse.data.message}`);
      }
    }

    // Step 3: Deallocate the instance by setting AllocatedUserId to NULL and Booted to FALSE
    await pool.query('UPDATE Instance SET AllocatedUserId = NULL, Booted = FALSE WHERE InstanceId = $1', [instanceId]);

    res.status(200).send('Instance deallocated and reset successfully');
  } catch (error) {
    console.error('Error deallocating instance:', error);
    res.status(500).send('Error deallocating instance');
  }
});

module.exports = router;
