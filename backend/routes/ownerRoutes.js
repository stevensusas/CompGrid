const express = require('express');
const { authenticateToken, authenticateOwner } = require('../authMiddleware');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool();  // Assuming database configuration is in environment variables

// Register instance
router.post('/instances', authenticateToken, authenticateOwner, async (req, res) => {
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

// Delete instance
router.delete('/instances/:id', authenticateToken, authenticateOwner, async (req, res) => {
  const instanceId = req.params.id;
  try {
    await pool.query('DELETE FROM Instance WHERE InstanceId = $1', [instanceId]);
    res.status(200).send('Instance removed successfully');
  } catch (error) {
    res.status(500).send('Error removing instance');
  }
});

module.exports = router;
