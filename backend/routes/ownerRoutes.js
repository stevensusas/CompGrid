require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticateToken } = require('../authMiddleware');

const router = express.Router();

// Login route (public)
router.post('/login-owner', async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Login attempt:', username);
    
    console.log('JWT Secret:', 'CompGrid_SuperSecretKey_2024');
    
    const userResult = await pool.query(
      'SELECT * FROM Users WHERE Username = $1 AND Role = $2',
      [username, 'admin']
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { 
        id: user.userid, 
        role: user.role 
      },
      'CompGrid_SuperSecretKey_2024',
      { 
        expiresIn: '24h',
        algorithm: 'HS256'
      }
    );

    console.log('Token generated:', token);

    res.json({
      token,
      user: {
        userId: user.userid,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Add this before the protected routes middleware
router.post('/register-owner', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT * FROM Users WHERE Username = $1',
      [username]
    );

    if (existingUser.rowCount > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with admin role
    const result = await pool.query(
      'INSERT INTO Users (Username, Password, Role) VALUES ($1, $2, $3) RETURNING UserId, Username, Role',
      [username, hashedPassword, 'admin']
    );

    res.status(201).json({
      message: 'Registration successful',
      user: {
        userId: result.rows[0].userid,
        username: result.rows[0].username,
        role: result.rows[0].role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Protected routes below this middleware
router.use(authenticateToken);

router.get('/instances', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.InstanceId as instanceid,
        i.InstanceName as instancename,
        i.IPAddress as ipaddress,
        i.Booted as status,
        it.InstanceType as type,
        it.SystemType as systemtype,
        it.CPUCoreCount as cpucorecount,
        it.Storage as storage,
        it.Memory as memory,
        pt.price_tier,
        pt.PricePerHour as priceperhour
      FROM Instance i
      LEFT JOIN InstanceType it ON i.InstanceTypeId = it.InstanceTypeId
      LEFT JOIN PriceTier pt ON it.PriceTierId = pt.PriceTierId
    `);

    // Transform the data to ensure proper casing and format
    const transformedRows = result.rows.map(row => ({
      ...row,
      status: Boolean(row.status), // Convert to boolean
      cpucorecount: Number(row.cpucorecount),
      storage: Number(row.storage),
      memory: Number(row.memory),
      priceperhour: Number(row.priceperhour)
    }));

    res.json(transformedRows);
  } catch (error) {
    console.error('Error fetching instances:', error);
    res.status(500).json({ message: 'Error fetching instances' });
  }
});

router.get('/instance-types', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        it.InstanceTypeId,
        it.InstanceType,
        it.SystemType,
        it.CPUCoreCount,
        it.Storage,
        it.Memory,
        pt.price_tier,
        pt.PricePerHour
      FROM InstanceType it
      JOIN PriceTier pt ON it.PriceTierId = pt.PriceTierId
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching instance types:', error);
    res.status(500).json({ message: 'Error fetching instance types' });
  }
});

router.get('/price-tiers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        PriceTierId as pricetierId,
        price_tier,
        PricePerHour as priceperhour
      FROM PriceTier
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching price tiers:', error);
    res.status(500).json({ message: 'Error fetching price tiers' });
  }
});

// Create new instance type
router.post('/instance', async (req, res) => {
  try {
    const { instanceName, instanceType, ipAddress, username, password } = req.body;
    const result = await pool.query(
      `INSERT INTO instance 
       (instancename, instancetypeid, ipaddress, username, password, booted, allocateduserid)
       VALUES ($1, $2, $3, $4, $5, False, NULL)
       RETURNING *`,
      [instanceName, instanceType, ipAddress, username, password]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating instance:', error);
    res.status(500).json({ message: 'Error creating instance' });
  }
});


// Create new instance type
router.post('/instance-types', async (req, res) => {
  try {
    const { instanceType, systemType, cpuCoreCount, memory, storage, priceTierId } = req.body;
    
    const result = await pool.query(
      `INSERT INTO InstanceType 
       (InstanceType, SystemType, CPUCoreCount, Memory, Storage, PriceTierId)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [instanceType, systemType, cpuCoreCount, memory, storage, priceTierId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating instance type:', error);
    res.status(500).json({ message: 'Error creating instance type' });
  }
});

// Create new price tier
router.post('/price-tiers', async (req, res) => {
  try {
    const { tierName, pricePerHour } = req.body;
    
    const result = await pool.query(
      `INSERT INTO PriceTier (price_tier, PricePerHour)
       VALUES ($1, $2)
       RETURNING *`,
      [tierName, pricePerHour]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating price tier:', error);
    res.status(500).json({ message: 'Error creating price tier' });
  }
});

module.exports = router;

