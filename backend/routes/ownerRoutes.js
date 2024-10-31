const express = require('express');
const { authenticateToken, authenticateOwner } = require('../authMiddleware');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool();  // Assuming database configuration is in environment variables

// Register instance
router.post('/instances', authenticateToken, authenticateOwner, async (req, res) => {
  const { ipAddress, username, password, instanceType } = req.body;
  try {
    // Get the InstanceTypeId based on instanceType provided in the request
    const instanceTypeResult = await pool.query(
      'SELECT InstanceTypeId FROM InstanceType WHERE InstanceType = $1',
      [instanceType]
    );

    if (instanceTypeResult.rowCount === 0) {
      return res.status(404).send('Instance type not found');
    }

    const instanceTypeId = instanceTypeResult.rows[0].instancetypeid;

    // Insert into Instance table using the InstanceTypeId as a foreign key
    await pool.query(
      `
      INSERT INTO Instance (InstanceTypeId, IPAddress, Username, Password, Booted) 
      VALUES ($1, $2, $3, $4, FALSE)
      `,
      [instanceTypeId, ipAddress, username, password]
    );

    res.status(201).send('Instance added successfully');
  } catch (error) {
    console.error('Error adding instance:', error);
    res.status(500).send('Error adding instance');
  }
});

// Register instance type
router.post('/instance-types', authenticateToken, authenticateOwner, async (req, res) => {
  const { instanceType, systemType, cpuCoreCount, storage, memory, priceTierId } = req.body;

  try {
    // Check if the referenced PriceTier exists
    const priceTierCheck = await pool.query('SELECT * FROM PriceTier WHERE PriceTierId = $1', [priceTierId]);

    if (priceTierCheck.rowCount === 0) {
      return res.status(404).send('Price tier not found');
    }

    // Insert the new instance type
    await pool.query(
      `
      INSERT INTO InstanceType (InstanceType, SystemType, CPUCoreCount, Storage, Memory, PriceTierId)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [instanceType, systemType, cpuCoreCount, storage, memory, priceTierId]
    );

    res.status(201).send('Instance type added successfully');
  } catch (error) {
    console.error('Error adding instance type:', error);
    res.status(500).send('Error adding instance type');
  }
});

// Delete instance
router.delete('/instances/:id', authenticateToken, authenticateOwner, async (req, res) => {
  const instanceId = req.params.id;

  try {
    // Check if the instance exists before attempting deletion
    const instanceCheck = await pool.query('SELECT * FROM Instance WHERE InstanceId = $1', [instanceId]);

    if (instanceCheck.rowCount === 0) {
      return res.status(404).send('Instance not found');
    }

    // Delete the instance
    await pool.query('DELETE FROM Instance WHERE InstanceId = $1', [instanceId]);

    res.status(200).send('Instance removed successfully');
  } catch (error) {
    console.error('Error removing instance:', error);
    res.status(500).send('Error removing instance');
  }
});

module.exports = router;

