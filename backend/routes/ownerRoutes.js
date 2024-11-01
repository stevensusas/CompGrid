const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { authenticateToken, authenticateOwner } = require('../authMiddleware');


const router = express.Router();
const pool = new Pool();  // Assuming database configuration is in environment variables

// Owner Registration
router.post('/register-owner', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check if username already exists
    const existingUser = await pool.query('SELECT * FROM Users WHERE Username = $1', [username]);
    if (existingUser.rowCount > 0) {
      return res.status(400).send('Username already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new owner
    await pool.query(
      `INSERT INTO Users (Username, Password, Role) VALUES ($1, $2, 'admin')`,
      [username, hashedPassword]
    );

    res.status(201).send('Owner registered successfully');
  } catch (error) {
    console.error('Error registering owner:', error);
    res.status(500).send('Error registering owner');
  }
});

// Owner Login
router.post('/login-owner', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM Users WHERE Username = $1 AND Role = $2', [username, 'admin']);

    if (userResult.rowCount === 0) {
      return res.status(400).send('Invalid username or password');
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send('Invalid username or password');
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.userid, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error logging in owner:', error);
    res.status(500).send('Error logging in owner');
  }
});

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

// Get all instances
router.get('/instances', authenticateToken, authenticateOwner, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.InstanceId, i.IPAddress, i.Username, i.Booted, 
             it.InstanceType, it.SystemType, it.CPUCoreCount, it.Storage, it.Memory, 
             pt.price_tier, pt.PricePerHour
      FROM Instance i
      JOIN InstanceType it ON i.InstanceTypeId = it.InstanceTypeId
      JOIN PriceTier pt ON it.PriceTierId = pt.PriceTierId
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error retrieving instances:', error);
    res.status(500).send('Error retrieving instances');
  }
});

// Get all instance types
router.get('/instance-types', authenticateToken, authenticateOwner, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT InstanceTypeId, InstanceType, SystemType, CPUCoreCount, Storage, Memory, PriceTierId 
      FROM InstanceType
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error retrieving instance types:', error);
    res.status(500).send('Error retrieving instance types');
  }
});

// Get all price tiers
router.get('/price-tiers', authenticateToken, authenticateOwner, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT PriceTierId, price_tier, PricePerHour 
      FROM PriceTier
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error retrieving price tiers:', error);
    res.status(500).send('Error retrieving price tiers');
  }
});


module.exports = router;

