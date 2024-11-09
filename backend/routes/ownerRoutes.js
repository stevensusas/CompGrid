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

// Request an instance based on requirements
router.post('/request-instance', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      cpucorecount, 
      memory, 
      storage,
      systemtype,
      maxPricePerHour 
    } = req.body;

    // First, find matching instance types within price range
    const matchingTypes = await pool.query(`
      SELECT 
        it.instancetypeid,
        it.instancetype,
        it.systemtype,
        it.cpucorecount,
        it.memory,
        it.storage,
        it.free_count,
        pt.priceperhour
      FROM public.instancetype it
      JOIN public.pricetier pt ON it.pricetierId = pt.pricetierId
      WHERE it.cpucorecount >= $1 
      AND it.memory >= $2 
      AND it.storage >= $3
      AND it.systemtype = $4
      AND pt.priceperhour <= $5
      AND it.free_count > 0
      ORDER BY pt.priceperhour ASC
    `, [cpucorecount, memory, storage, systemtype, maxPricePerHour]);

    if (matchingTypes.rows.length === 0) {
      return res.status(404).json({ 
        message: 'No available instance types match your requirements' 
      });
    }

    // Get the first (cheapest) matching type
    const selectedType = matchingTypes.rows[0];

    // Find an available instance of this type
    const availableInstance = await pool.query(`
      SELECT instanceid, instancename
      FROM public.instance
      WHERE instancetypeid = $1
      AND allocateduserid IS NULL
      AND booted = false
      LIMIT 1
    `, [selectedType.instancetypeid]);

    if (availableInstance.rows.length === 0) {
      return res.status(404).json({ 
        message: 'No available instances of this type' 
      });
    }

    // Begin transaction to ensure atomic updates
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Allocate instance to user
      const instanceId = availableInstance.rows[0].instanceid;
      await client.query(`
        UPDATE public.instance 
        SET allocateduserid = $1 
        WHERE instanceid = $2
      `, [userId, instanceId]);

      // Decrease free_count of instance type
      await client.query(`
        UPDATE public.instancetype 
        SET free_count = free_count - 1 
        WHERE instancetypeid = $1
      `, [selectedType.instancetypeid]);

      await client.query('COMMIT');

      // Return allocated instance details
      const result = await pool.query(`
        SELECT 
          i.instanceid,
          i.instancename,
          i.ipaddress,
          i.username,
          i.password,
          i.booted,
          it.instancetype,
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

      res.json({
        message: 'Instance allocated successfully',
        instance: result.rows[0]
      });

    } catch (err) {
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

// Optional: Add a route to check availability before requesting
router.get('/check-instance-availability', async (req, res) => {
  try {
    const { 
      cpucorecount, 
      memory, 
      storage,
      systemtype,
      maxPricePerHour 
    } = req.query;

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
        COUNT(i.instanceid) FILTER (WHERE i.allocateduserid IS NULL) as available_instances
      FROM public.instancetype it
      JOIN public.pricetier pt ON it.pricetierId = pt.pricetierId
      LEFT JOIN public.instance i ON it.instancetypeid = i.instancetypeid
      WHERE it.cpucorecount >= $1 
      AND it.memory >= $2 
      AND it.storage >= $3
      AND it.systemtype = $4
      AND pt.priceperhour <= $5
      AND it.free_count > 0
      GROUP BY it.instancetypeid, pt.pricetierId
      ORDER BY pt.priceperhour ASC
    `, [cpucorecount, memory, storage, systemtype, maxPricePerHour]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'Error checking instance availability' });
  }
});

// Add this new endpoint before module.exports
router.get('/cluster-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_instances,
        COUNT(CASE WHEN allocateduserid IS NOT NULL THEN 1 END) as assigned_instances
      FROM Instance
    `);
    
    const stats = result.rows[0];
    const assignmentPercentage = stats.total_instances > 0 
      ? (stats.assigned_instances / stats.total_instances * 100).toFixed(1)
      : 0;

    res.json({
      totalInstances: parseInt(stats.total_instances),
      assignedInstances: parseInt(stats.assigned_instances),
      assignmentPercentage: parseFloat(assignmentPercentage)
    });
  } catch (error) {
    console.error('Error fetching cluster stats:', error);
    res.status(500).json({ message: 'Error fetching cluster stats' });
  }
});

// Add this new endpoint
router.get('/earnings-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(
          pt.priceperhour * 
          EXTRACT(EPOCH FROM (ul.endtime - ul.starttime))/3600
        ), 0) as total_earnings
      FROM UsageLogs ul
      JOIN Instance i ON ul.instanceid = i.instanceid
      JOIN InstanceType it ON i.instancetypeid = it.instancetypeid
      JOIN PriceTier pt ON it.pricetierId = pt.pricetierId
      WHERE ul.endtime IS NOT NULL
      
      UNION ALL
      
      SELECT 
        COALESCE(SUM(
          pt.priceperhour * 
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ul.starttime))/3600
        ), 0) as total_earnings
      FROM UsageLogs ul
      JOIN Instance i ON ul.instanceid = i.instanceid
      JOIN InstanceType it ON i.instancetypeid = it.instancetypeid
      JOIN PriceTier pt ON it.pricetierId = pt.pricetierId
      WHERE ul.endtime IS NULL
    `);
    
    // Sum up both completed and ongoing usage
    const totalEarnings = result.rows.reduce((sum, row) => sum + parseFloat(row.total_earnings), 0);
    
    res.json({
      totalEarnings: totalEarnings.toFixed(2)
    });
  } catch (error) {
    console.error('Error fetching earnings stats:', error);
    res.status(500).json({ message: 'Error fetching earnings stats' });
  }
});

// Add this new endpoint
router.get('/runtime-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (ul.endtime - ul.starttime))/3600
        ), 0) as completed_hours
      FROM UsageLogs ul
      WHERE ul.endtime IS NOT NULL
      
      UNION ALL
      
      SELECT 
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ul.starttime))/3600
        ), 0) as active_hours
      FROM UsageLogs ul
      WHERE ul.endtime IS NULL
    `);
    
    // Sum up both completed and ongoing usage
    const totalHours = result.rows.reduce((sum, row) => sum + parseFloat(row.completed_hours || 0), 0);
    
    res.json({
      totalHours: totalHours.toFixed(1)
    });
  } catch (error) {
    console.error('Error fetching runtime stats:', error);
    res.status(500).json({ message: 'Error fetching runtime stats' });
  }
});

router.get('/runtime-by-type', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        it.instancetype,
        DATE_TRUNC('day', ul.starttime) as date,
        COALESCE(SUM(
          CASE 
            WHEN ul.endtime IS NOT NULL THEN
              EXTRACT(EPOCH FROM (ul.endtime - ul.starttime))/3600
            ELSE
              EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ul.starttime))/3600
          END
        ), 0) as hours
      FROM UsageLogs ul
      JOIN Instance i ON ul.instanceid = i.instanceid
      JOIN InstanceType it ON i.instancetypeid = it.instancetypeid
      WHERE ul.starttime >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY it.instancetype, DATE_TRUNC('day', ul.starttime)
      ORDER BY date ASC
    `);

    // Transform data into format needed for chart
    const instanceTypes = [...new Set(result.rows.map(row => row.instancetype))];
    const dates = [...new Set(result.rows.map(row => row.date))].sort();

    const datasets = instanceTypes.map(type => {
      const data = dates.map(date => {
        const match = result.rows.find(row => 
          row.instancetype === type && row.date.toISOString().split('T')[0] === date.toISOString().split('T')[0]
        );
        // Convert to number and handle null/undefined cases
        return match ? Number(match.hours || 0).toFixed(1) : 0;
      });

      return {
        label: type,
        data: data,
        fill: false,
        tension: 0.4
      };
    });

    res.json({
      labels: dates.map(d => d.toISOString().split('T')[0]),
      datasets: datasets
    });
  } catch (error) {
    console.error('Error fetching runtime by type:', error);
    res.status(500).json({ message: 'Error fetching runtime data' });
  }
});

router.get('/cost-by-type', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH daily_costs AS (
        SELECT 
          it.instancetype,
          DATE_TRUNC('day', ul.starttime) as date,
          COALESCE(SUM(
            pt.priceperhour * 
            CASE 
              WHEN ul.endtime IS NOT NULL THEN
                EXTRACT(EPOCH FROM (ul.endtime - ul.starttime))/3600
              ELSE
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ul.starttime))/3600
            END
          ), 0) as daily_cost
        FROM UsageLogs ul
        JOIN Instance i ON ul.instanceid = i.instanceid
        JOIN InstanceType it ON i.instancetypeid = it.instancetypeid
        JOIN PriceTier pt ON it.pricetierId = pt.pricetierId
        WHERE ul.starttime >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY it.instancetype, DATE_TRUNC('day', ul.starttime)
      )
      SELECT 
        instancetype,
        date,
        SUM(daily_cost) OVER (
          PARTITION BY instancetype 
          ORDER BY date
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) as cumulative_cost
      FROM daily_costs
      ORDER BY date ASC
    `);

    // Transform data into format needed for chart
    const instanceTypes = [...new Set(result.rows.map(row => row.instancetype))];
    const dates = [...new Set(result.rows.map(row => row.date))].sort();

    const datasets = instanceTypes.map(type => {
      const data = dates.map(date => {
        const match = result.rows.find(row => 
          row.instancetype === type && row.date.toISOString().split('T')[0] === date.toISOString().split('T')[0]
        );
        return match ? Number(match.cumulative_cost || 0).toFixed(2) : 0;
      });

      return {
        label: type,
        data: data,
        fill: false,
        tension: 0.4
      };
    });

    res.json({
      labels: dates.map(d => d.toISOString().split('T')[0]),
      datasets: datasets
    });
  } catch (error) {
    console.error('Error fetching cost by type:', error);
    res.status(500).json({ message: 'Error fetching cost data' });
  }
});

router.get('/top-users', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH user_stats AS (
        SELECT 
          u.userid,
          u.username,
          COALESCE(SUM(
            CASE 
              WHEN ul.endtime IS NOT NULL THEN
                EXTRACT(EPOCH FROM (ul.endtime - ul.starttime))/3600
              ELSE
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ul.starttime))/3600
            END
          ), 0) as total_hours,
          COALESCE(SUM(
            pt.priceperhour * 
            CASE 
              WHEN ul.endtime IS NOT NULL THEN
                EXTRACT(EPOCH FROM (ul.endtime - ul.starttime))/3600
              ELSE
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ul.starttime))/3600
            END
          ), 0) as total_cost
        FROM Users u
        LEFT JOIN Instance i ON u.userid = i.allocateduserid
        LEFT JOIN UsageLogs ul ON i.instanceid = ul.instanceid
        LEFT JOIN InstanceType it ON i.instancetypeid = it.instancetypeid
        LEFT JOIN PriceTier pt ON it.pricetierId = pt.pricetierId
        WHERE u.role = 'user'
        GROUP BY u.userid, u.username
      )
      SELECT 
        userid,
        username,
        ROUND(total_hours::numeric, 1) as total_hours,
        ROUND(total_cost::numeric, 2) as total_cost
      FROM user_stats
      ORDER BY total_cost DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching top users:', error);
    res.status(500).json({ message: 'Error fetching top users' });
  }
});

module.exports = router;

