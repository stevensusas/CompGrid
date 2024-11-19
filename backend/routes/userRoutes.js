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

(async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (err) {
    console.error('Redis connection error:', err);
  }
})();

redisClient.on('error', err => console.log('Redis Client Error', err));

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
        userId: user.userid, 
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

router.use(authenticateToken, (req, res, next) => {
  console.log('Authenticated user:', req.user);
  next();
});

router.get('/instances', async (req, res) => {
  try {
    // Get the authenticated user's ID
    const userId = req.user.userId;
    console.log('Filtering instances for user ID:', userId);

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
      WHERE i.AllocatedUserId = $1  -- Filter by the authenticated user's ID
    `, [userId]);

    // Log the query results for debugging
    console.log('User ID:', userId);
    console.log('Number of instances found:', result.rows.length);
    console.log('Query results:', result.rows);

    const transformedRows = result.rows.map(row => ({
      ...row,
      status: Boolean(row.status),
      cpucorecount: Number(row.cpucorecount),
      storage: Number(row.storage),
      memory: Number(row.memory),
      priceperhour: Number(row.priceperhour)
    }));

    res.json(transformedRows);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error fetching instances' });
  }
});

router.get('/:userId/instances', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Fetching instances for userId:', userId);
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
      WHERE i.AllocatedUserId = $1
    `, [userId]);

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

// Main endpoint handler
router.post('/request-instance', authenticateToken, authenticateUser, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.userId;
    const { instancetype } = req.body;

    console.log('Request received:', { userId, instancetype });

    await client.query('BEGIN');

    // Find an available instance of the requested type
    const instanceCheck = await client.query(`
      SELECT i.instanceid, it.instancetypeid
      FROM public.instancetype it
      JOIN public.instance i ON it.instancetypeid = i.instancetypeid
      WHERE it.instancetype = $1 
        AND i.allocateduserid IS NULL
        AND i.booted = false
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `, [instancetype]);

    if (instanceCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'No available instances of this type' });
    }

    const { instanceid, instancetypeid } = instanceCheck.rows[0];

    // Allocate the instance to the user
    const allocationResult = await client.query(`
      UPDATE public.instance i
      SET allocateduserid = $1
      WHERE instanceid = $2
      RETURNING 
        i.instanceid,
        i.instancename,
        i.ipaddress,
        i.username,
        i.password,
        i.booted as status,
        (SELECT instancetype FROM public.instancetype WHERE instancetypeid = i.instancetypeid) as type,
        (SELECT systemtype FROM public.instancetype WHERE instancetypeid = i.instancetypeid) as systemtype,
        (SELECT cpucorecount FROM public.instancetype WHERE instancetypeid = i.instancetypeid) as cpucorecount,
        (SELECT memory FROM public.instancetype WHERE instancetypeid = i.instancetypeid) as memory,
        (SELECT storage FROM public.instancetype WHERE instancetypeid = i.instancetypeid) as storage,
        (SELECT pt.priceperhour FROM public.pricetier pt 
         JOIN public.instancetype it ON pt.pricetierId = it.pricetierId 
         WHERE it.instancetypeid = i.instancetypeid) as priceperhour
    `, [userId, instanceid]);

    if (allocationResult.rowCount === 0) {
      throw new Error('Failed to allocate instance');
    }

    // Update the free count
    await client.query(`
      UPDATE public.instancetype
      SET free_count = free_count - 1
      WHERE instancetypeid = $1
    `, [instancetypeid]);

    await client.query('COMMIT');

    console.log('Instance allocated:', allocationResult.rows[0]);

    res.json({
      message: 'Instance allocated successfully',
      instance: allocationResult.rows[0]
    });

  } catch (err) {
    console.error('Transaction error:', err);
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error allocating instance', error: err.message });
  } finally {
    client.release();
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

// Add this new endpoint
router.get('/count/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT COUNT(*) as instance_count FROM Instance WHERE AllocatedUserId = $1',
      [userId]
    );
    res.json({ count: parseInt(result.rows[0].instance_count) });
  } catch (error) {
    console.error('Error counting instances:', error);
    res.status(500).json({ message: 'Error counting instances' });
  }
});

router.get('/total-cost/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await pool.query(`
      WITH InstanceCosts AS (
        SELECT 
          i.instanceid,
          i.instancename,
          pt.priceperhour,
          ul.starttime,
          ul.endtime,
          CASE 
            WHEN ul.endtime IS NULL AND i.booted = true THEN
              EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ul.starttime)) / 3600 * pt.priceperhour
            WHEN ul.endtime IS NOT NULL THEN
              EXTRACT(EPOCH FROM (ul.endtime - ul.starttime)) / 3600 * pt.priceperhour
            ELSE 0
          END as usage_cost
        FROM Instance i
        JOIN InstanceType it ON i.instancetypeid = it.instancetypeid
        JOIN PriceTier pt ON it.pricetierId = pt.pricetierId
        LEFT JOIN UsageLogs ul ON i.instanceid = ul.instanceid
        WHERE i.allocateduserid = $1
      )
      SELECT 
        COALESCE(SUM(usage_cost), 0) as total_cost,
        COUNT(DISTINCT instanceid) as instance_count
      FROM InstanceCosts
    `, [userId]);
    
    const totalCost = parseFloat(result.rows[0].total_cost || 0).toFixed(2);
    
    res.json({ 
      totalCost,
      instanceCount: parseInt(result.rows[0].instance_count),
      success: true 
    });
    
  } catch (error) {
    console.error('Error calculating total cost:', error);
    res.status(500).json({ 
      message: 'Error calculating total cost',
      success: false,
      error: error.message 
    });
  }
});

router.get('/total-usage/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await pool.query(`
      WITH UsageTimes AS (
        SELECT 
          i.instanceid,
          CASE 
            WHEN ul.endtime IS NULL AND i.booted = true THEN
              EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ul.starttime)) / 3600
            WHEN ul.endtime IS NOT NULL THEN
              EXTRACT(EPOCH FROM (ul.endtime - ul.starttime)) / 3600
            ELSE 0
          END as hours_used
        FROM Instance i
        LEFT JOIN UsageLogs ul ON i.instanceid = ul.instanceid
        WHERE i.allocateduserid = $1
      )
      SELECT COALESCE(SUM(hours_used), 0) as total_hours
      FROM UsageTimes
    `, [userId]);
    
    const totalHours = parseFloat(result.rows[0].total_hours || 0).toFixed(1);
    res.json({ totalHours });
    
  } catch (error) {
    console.error('Error calculating total usage:', error);
    res.status(500).json({ message: 'Error calculating total usage' });
  }
});

router.get('/hourly-costs/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    // Get data for the last 24 hours by default
    const result = await pool.query(`
      WITH RECURSIVE hours AS (
        SELECT date_trunc('hour', NOW() - interval '23 hours') as hour
        UNION ALL
        SELECT hour + interval '1 hour'
        FROM hours
        WHERE hour < date_trunc('hour', NOW())
      ),
      hourly_costs AS (
        SELECT 
          date_trunc('hour', ul.starttime) as hour,
          SUM(
            CASE 
              WHEN ul.endtime IS NULL AND i.booted = true THEN
                EXTRACT(EPOCH FROM (
                  LEAST(date_trunc('hour', NOW()) + interval '1 hour', NOW()) - 
                  GREATEST(date_trunc('hour', ul.starttime), ul.starttime)
                )) / 3600 * pt.priceperhour
              WHEN ul.endtime IS NOT NULL THEN
                EXTRACT(EPOCH FROM (
                  LEAST(date_trunc('hour', NOW()) + interval '1 hour', ul.endtime) - 
                  GREATEST(date_trunc('hour', ul.starttime), ul.starttime)
                )) / 3600 * pt.priceperhour
              ELSE 0
            END
          ) as cost
        FROM Instance i
        JOIN InstanceType it ON i.instancetypeid = it.instancetypeid
        JOIN PriceTier pt ON it.pricetierId = pt.pricetierId
        JOIN UsageLogs ul ON i.instanceid = ul.instanceid
        WHERE i.allocateduserid = $1
        AND ul.starttime >= NOW() - interval '24 hours'
        GROUP BY date_trunc('hour', ul.starttime)
      )
      SELECT 
        hours.hour,
        COALESCE(hourly_costs.cost, 0) as cost
      FROM hours
      LEFT JOIN hourly_costs ON hours.hour = hourly_costs.hour
      ORDER BY hours.hour;
    `, [userId]);
    
    const hourlyData = result.rows.map(row => ({
      hour: row.hour,
      cost: parseFloat(row.cost).toFixed(2)
    }));

    res.json({ hourlyData });
    
  } catch (error) {
    console.error('Error calculating hourly costs:', error);
    res.status(500).json({ message: 'Error calculating hourly costs' });
  }
});

router.get('/cumulative-costs/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await pool.query(`
      WITH RECURSIVE hours AS (
        SELECT date_trunc('hour', NOW() - interval '23 hours') as hour
        UNION ALL
        SELECT hour + interval '1 hour'
        FROM hours
        WHERE hour < date_trunc('hour', NOW())
      ),
      instance_costs AS (
        SELECT 
          i.instanceid,
          i.instancename,
          date_trunc('hour', ul.starttime) as hour,
          SUM(
            CASE 
              WHEN ul.endtime IS NULL AND i.booted = true THEN
                EXTRACT(EPOCH FROM (
                  LEAST(date_trunc('hour', NOW()) + interval '1 hour', NOW()) - 
                  GREATEST(date_trunc('hour', ul.starttime), ul.starttime)
                )) / 3600 * pt.priceperhour
              WHEN ul.endtime IS NOT NULL THEN
                EXTRACT(EPOCH FROM (
                  LEAST(date_trunc('hour', NOW()) + interval '1 hour', ul.endtime) - 
                  GREATEST(date_trunc('hour', ul.starttime), ul.starttime)
                )) / 3600 * pt.priceperhour
              ELSE 0
            END
          ) as hourly_cost
        FROM Instance i
        JOIN InstanceType it ON i.instancetypeid = it.instancetypeid
        JOIN PriceTier pt ON it.pricetierId = pt.pricetierId
        JOIN UsageLogs ul ON i.instanceid = ul.instanceid
        WHERE i.allocateduserid = $1
        AND ul.starttime >= NOW() - interval '24 hours'
        GROUP BY i.instanceid, i.instancename, date_trunc('hour', ul.starttime)
      ),
      cumulative_costs AS (
        SELECT 
          ic.instanceid,
          ic.instancename,
          h.hour,
          SUM(COALESCE(ic2.hourly_cost, 0)) as cumulative_cost
        FROM hours h
        CROSS JOIN (SELECT DISTINCT instanceid, instancename FROM instance_costs) ic
        LEFT JOIN instance_costs ic2 
          ON ic.instanceid = ic2.instanceid 
          AND ic2.hour <= h.hour
        GROUP BY ic.instanceid, ic.instancename, h.hour
        ORDER BY h.hour, ic.instancename
      )
      SELECT 
        instanceid,
        instancename,
        hour,
        ROUND(cumulative_cost::numeric, 2) as cost
      FROM cumulative_costs
      ORDER BY hour, instancename;
    `, [userId]);

    // Transform the data for the chart
    const instances = [...new Set(result.rows.map(row => row.instancename))];
    const hours = [...new Set(result.rows.map(row => row.hour))];
    
    const chartData = {
      hours: hours,
      datasets: instances.map(instance => ({
        instanceName: instance,
        data: result.rows
          .filter(row => row.instancename === instance)
          .map(row => ({
            hour: row.hour,
            cost: parseFloat(row.cost)
          }))
      }))
    };

    res.json(chartData);
    
  } catch (error) {
    console.error('Error calculating cumulative costs:', error);
    res.status(500).json({ message: 'Error calculating cumulative costs' });
  }
});

router.get('/uptime/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await pool.query(`
      SELECT 
        i.instanceid,
        i.instancename,
        ROUND(
          SUM(
            EXTRACT(EPOCH FROM (
              CASE 
                WHEN ul.endtime IS NULL AND i.booted = true THEN NOW()
                ELSE COALESCE(ul.endtime, NOW())
              END - ul.starttime
            )) / 3600
          )::numeric, 
          1
        ) as total_hours
      FROM Instance i
      LEFT JOIN UsageLogs ul ON i.instanceid = ul.instanceid
      WHERE i.allocateduserid = $1
      GROUP BY i.instanceid, i.instancename
      ORDER BY i.instancename;
    `, [userId]);

    res.json({
      instances: result.rows.map(row => ({
        name: row.instancename,
        hours: parseFloat(row.total_hours)
      }))
    });
    
  } catch (error) {
    console.error('Error calculating instance uptime:', error);
    res.status(500).json({ message: 'Error calculating instance uptime' });
  }
});

module.exports = router;
