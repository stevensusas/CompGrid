const express = require('express');
const { authenticateToken, authenticateUser } = require('../authMiddleware');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { createClient } = require('redis');

// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.connect();

const router = express.Router();

require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'CompGrid_SuperSecretKey_2024';

// Login route (public)
router.post('/login-user', async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Login attempt:', username);
    
    console.log('JWT Secret:', 'CompGrid_SuperSecretKey_2024');
    
    const userResult = await pool.query(
      'SELECT * FROM Users WHERE Username = $1 AND Role = $2',
      [username, 'user']
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

// User Registration
// Add this before the protected routes middleware
router.post('/register-user', async (req, res) => {
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
      [username, hashedPassword, 'user']
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

router.use(authenticateToken);

router.get('/instances', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.InstanceId as instanceid,
        i.InstanceName as instancename,
        i.IPAddress as ipaddress,
        i.Booted as status,
        i.Username as username,
        i.AllocatedUserId as allocateduserid,
        u.Username as allocated_username,
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
      LEFT JOIN Users u ON i.AllocatedUserId = u.UserId
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

    const startTime = new Date().toISOString();
    await redisClient.set(`instance:${instanceName}:startTime`, startTime);

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

    const startTime = await redisClient.get(`instance:${instanceName}:startTime`);
    if (!startTime) {
      console.warn(`No start time found for instance ${instanceName}`);
    }

    const endTime = new Date().toISOString();
    // If we have a start time, log the usage
    if (startTime) {
      // Get the instance and user details
      const instanceDetails = await pool.query(
        'SELECT InstanceId, AllocatedUserId FROM Instance WHERE InstanceName = $1',
        [instanceName]
      );

      if (instanceDetails.rows.length > 0) {
        const { instanceid, allocateduserid } = instanceDetails.rows[0];
        
        // Insert into UsageLogs
        await pool.query(
          'INSERT INTO UsageLogs (UserId, InstanceId, StartTime, EndTime) VALUES ($1, $2, $3, $4)',
          [allocateduserid, instanceid, startTime, endTime]
        );

        // Clean up Redis
        await redisClient.del(`instance:${instanceName}:startTime`);
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error stopping instance:', error);
    res.status(500).json({ 
      message: error.message || 'Error stopping instance'
    });
  }
});

router.get('/instances/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Add logging to debug
    console.log('Fetching instances for userId:', userId);

    const query = `
      SELECT 
        i.instanceid,
        i.instancename,
        i.ipaddress,
        i.booted as status,
        i.username,
        i.allocateduserid,
        i.password,
        it.instancetype as type,
        it.systemtype,
        it.cpucorecount,
        it.storage,
        it.memory,
        pt.priceperhour
      FROM instance i
      LEFT JOIN instancetype it ON i.instancetypeid = it.instancetypeid
      LEFT JOIN pricetier pt ON it.pricetierId = pt.pricetierId
      WHERE i.allocateduserid = $1
    `;

    const result = await pool.query(query, [userId]);
    
    // Add logging to debug
    console.log('Query result:', result.rows);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching instances:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Request an instance of a specific type
router.post('/request-instance', authenticateToken, authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userid;
    const { instancetype } = req.body;
    
    console.log('Request received:', {
      userId,
      instancetype,
      userObject: req.user
    });

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Log the instance type query
      const typeResult = await client.query(`
        SELECT 
          it.instancetypeid,
          it.free_count,
          COUNT(i.instanceid) FILTER (WHERE i.allocateduserid IS NULL AND i.booted = false) as available_instances
        FROM public.instancetype it
        LEFT JOIN public.instance i ON it.instancetypeid = i.instancetypeid
        WHERE it.instancetype = $1
        GROUP BY it.instancetypeid
      `, [instancetype]);

      console.log('Type result:', typeResult.rows);

      if (typeResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          message: 'Instance type not found' 
        });
      }

      const instanceType = typeResult.rows[0];
      console.log('Available instances:', instanceType.available_instances);

      if (instanceType.available_instances === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: 'No available instances of this type' 
        });
      }

      // Log the instance selection query
      const instanceResult = await client.query(`
        SELECT instanceid, instancename 
        FROM public.instance 
        WHERE instancetypeid = $1 
        AND allocateduserid IS NULL 
        AND booted = false
        ORDER BY RANDOM() 
        LIMIT 1
      `, [instanceType.instancetypeid]);

      console.log('Selected instance:', instanceResult.rows);

      const instanceId = instanceResult.rows[0].instanceid;

      // Log the allocation update
      const updateResult = await client.query(`
        UPDATE public.instance 
        SET allocateduserid = $1 
        WHERE instanceid = $2
        RETURNING *
      `, [userId, instanceId]);

      console.log('Update result:', updateResult.rows);

      // Update the free_count
      const freeCountUpdate = await client.query(`
        UPDATE public.instancetype 
        SET free_count = free_count - 1 
        WHERE instancetypeid = $1
        RETURNING *
      `, [instanceType.instancetypeid]);

      console.log('Free count update:', freeCountUpdate.rows);

      await client.query('COMMIT');

      // Get the full instance details
      const result = await pool.query(`
        SELECT 
          i.instanceid,
          i.instancename,
          i.ipaddress,
          i.booted as status,
          it.instancetype as type,
          it.systemtype,
          it.cpucorecount,
          it.memory,
          it.storage,
          pt.price_tier,
          pt.priceperhour
        FROM public.instance i
        JOIN public.instancetype it ON i.instancetypeid = it.instancetypeid
        JOIN public.pricetier pt ON it.pricetierId = pt.pricetierId
        WHERE i.instanceid = $1
      `, [instanceId]);

      console.log('Final result:', result.rows);

      res.json({
        message: 'Instance allocated successfully',
        instance: result.rows[0]
      });

    } catch (err) {
      console.error('Transaction error:', err);
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error allocating instance:', error);
    res.status(500).json({ 
      message: 'Error allocating instance',
      error: error.message 
    });
  }
});

// Get available instance types
router.get('/available-instance-types', authenticateToken, authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        it.instancetype,
        it.systemtype,
        it.cpucorecount,
        it.memory,
        it.storage,
        it.free_count,
        pt.price_tier,
        pt.priceperhour,
        COUNT(i.instanceid) FILTER (WHERE i.allocateduserid IS NULL AND i.booted = false) as available_instances
      FROM public.instancetype it
      JOIN public.pricetier pt ON it.pricetierId = pt.pricetierId
      LEFT JOIN public.instance i ON it.instancetypeid = i.instancetypeid
      WHERE it.instancetype IN (
        'ArchLinux Micro',
        'ArchLinux Macro',
        'ArchLinux Mega',
        'ArchLinux MegaX'
      )
      GROUP BY it.instancetypeid, pt.pricetierId
      ORDER BY pt.priceperhour ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available instance types:', error);
    res.status(500).json({ message: 'Error fetching instance types' });
  }
});


module.exports = router;
