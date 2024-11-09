require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticateToken } = require('../authMiddleware');
const fetch = require('node-fetch'); // Make sure to install and import node-fetch

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
        i.instanceid,
        i.instancename,
        i.ipaddress,
        i.username,
        i.password,
        i.booted,
        i.allocateduserid,
        it.instancetype as type,
        it.systemtype,
        it.cpucorecount,
        it.memory,
        it.storage,
        pt.price_tier,
        pt.priceperhour
      FROM Instance i
      JOIN InstanceType it ON i.instancetypeid = it.instancetypeid
      JOIN PriceTier pt ON it.pricetierId = pt.pricetierId
    `);

    console.log('Fetched instances with booted status:', 
      result.rows.map(i => ({
        name: i.instancename,
        booted: i.booted
      }))
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching instances:', error);
    res.status(500).json({ message: 'Error fetching instances' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.UserId,
        u.Username,
        COUNT(i.InstanceId) as assigned_instances
      FROM Users u
      LEFT JOIN Instance i ON u.UserId = i.AllocatedUserId
      WHERE u.Role = 'user'
      GROUP BY u.UserId, u.Username
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
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
        pt.PricePerHour,
        COUNT(i.InstanceId) as total_instances,
        COUNT(i.AllocatedUserId) as assigned_count
      FROM InstanceType it
      JOIN PriceTier pt ON it.PriceTierId = pt.PriceTierId
      LEFT JOIN Instance i ON it.InstanceTypeId = i.InstanceTypeId
      GROUP BY 
        it.InstanceTypeId,
        it.InstanceType,
        it.SystemType,
        it.CPUCoreCount,
        it.Storage,
        it.Memory,
        pt.price_tier,
        pt.PricePerHour
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

router.post('/assign-instance', async (req, res) => {
  try {
    const { userId, instanceId } = req.body;
    
    const result = await pool.query(`
      UPDATE Instance 
      SET AllocatedUserId = $1 
      WHERE InstanceId = $2 
      RETURNING *
    `, [userId, instanceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Instance not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning instance:', error);
    res.status(500).json({ message: 'Error assigning instance' });
  }
});

router.get('/user/:userId/instances', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        i.instanceid,
        i.instancename,
        i.booted as status,
        it.instancetype as type,
        it.systemtype,
        it.cpucorecount,
        it.memory,
        it.storage,
        pt.price_tier,
        pt.priceperhour
      FROM Instance i
      JOIN InstanceType it ON i.instancetypeid = it.instancetypeid
      JOIN PriceTier pt ON it.pricetierId = pt.pricetierId
      WHERE i.allocateduserid = $1
    `, [userId]);

    // Transform the data to ensure proper casing and format
    const transformedRows = result.rows.map(row => ({
      ...row,
      status: Boolean(row.status), // Convert to boolean if needed
      cpucorecount: Number(row.cpucorecount),
      storage: Number(row.storage),
      memory: Number(row.memory),
      priceperhour: Number(row.priceperhour)
    }));

    res.json(transformedRows);
  } catch (error) {
    console.error('Error fetching user instances:', error);
    res.status(500).json({ message: 'Error fetching user instances' });
  }
});

// Get current endpoints
router.get('/control-endpoints', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ControlEndpoints WHERE id = 1');
    if (result.rows.length === 0) {
      res.json({ startEndpoint: '', stopEndpoint: '' });
    } else {
      res.json({
        startEndpoint: result.rows[0].start_endpoint,
        stopEndpoint: result.rows[0].stop_endpoint
      });
    }
  } catch (error) {
    console.error('Error fetching endpoints:', error);
    res.status(500).json({ message: 'Error fetching endpoints' });
  }
});

// Update endpoints
router.post('/control-endpoints', async (req, res) => {
  try {
    const { startEndpoint, stopEndpoint } = req.body;
    
    if (!startEndpoint || !stopEndpoint) {
      return res.status(400).json({ message: 'Both endpoints are required' });
    }

    // Upsert the endpoints
    const result = await pool.query(`
      INSERT INTO ControlEndpoints (id, start_endpoint, stop_endpoint)
      VALUES (1, $1, $2)
      ON CONFLICT (id) DO UPDATE 
      SET 
        start_endpoint = $1, 
        stop_endpoint = $2,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *
    `, [startEndpoint, stopEndpoint]);

    res.json({ 
      message: 'Endpoints saved successfully',
      endpoints: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving endpoints:', error);
    res.status(500).json({ message: 'Error saving endpoints' });
  }
});

// Update the start endpoint
router.post('/instances/:instanceName/start', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    // Check if instance is already running
    const instanceCheck = await pool.query(
      'SELECT booted FROM Instance WHERE instancename = $1',
      [instanceName]
    );

    if (instanceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Instance not found' });
    }

    if (instanceCheck.rows[0].booted) {
      return res.status(400).json({ message: 'Instance is already running' });
    }

    // 1. Get control endpoints from database
    const endpointsResult = await pool.query(
      'SELECT start_endpoint FROM ControlEndpoints WHERE id = 1'
    );
    
    if (endpointsResult.rows.length === 0) {
      return res.status(400).json({ message: 'Control endpoints not configured' });
    }

    const startEndpoint = endpointsResult.rows[0].start_endpoint;

    // 2. Call the control endpoint
    const controlResponse = await fetch(startEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ vm_name: instanceName })
    });

    if (!controlResponse.ok) {
      throw new Error('Failed to start instance through control endpoint');
    }

    // 3. Update instance status in database
    const result = await pool.query(`
      UPDATE Instance 
      SET booted = true 
      WHERE instancename = $1 
      RETURNING *
    `, [instanceName]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Instance not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error starting instance:', error);
    res.status(500).json({ 
      message: error.message || 'Error starting instance'
    });
  }
});

router.post('/instances/:instanceName/stop', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    // Check if instance is already stopped
    const instanceCheck = await pool.query(
      'SELECT booted FROM Instance WHERE instancename = $1',
      [instanceName]
    );

    if (instanceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Instance not found' });
    }

    if (!instanceCheck.rows[0].booted) {
      return res.status(400).json({ message: 'Instance is already stopped' });
    }

    // 1. Get control endpoints from database
    const endpointsResult = await pool.query(
      'SELECT stop_endpoint FROM ControlEndpoints WHERE id = 1'
    );
    
    if (endpointsResult.rows.length === 0) {
      return res.status(400).json({ message: 'Control endpoints not configured' });
    }

    const stopEndpoint = endpointsResult.rows[0].stop_endpoint;

    // 2. Call the control endpoint
    const controlResponse = await fetch(stopEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ vm_name: instanceName })
    });

    if (!controlResponse.ok) {
      throw new Error('Failed to stop instance through control endpoint');
    }

    // 3. Update instance status in database to false (stopped)
    const result = await pool.query(`
      UPDATE Instance 
      SET booted = false 
      WHERE instancename = $1 
      RETURNING *
    `, [instanceName]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Instance not found' });
    }

    // Log the update for debugging
    console.log('Instance status updated:', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error stopping instance:', error);
    res.status(500).json({ 
      message: error.message || 'Error stopping instance'
    });
  }
});

module.exports = router;

