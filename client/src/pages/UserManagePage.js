import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import config from '../config.json';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export default function UserManagePage() {
  const { user } = useAuth();
  const [instances, setInstances] = useState([]);
  const [orderBy, setOrderBy] = useState('');
  const [orderDirection, setOrderDirection] = useState('asc');

  const fetchData = useCallback(async (endpoint) => {
    try {
      if (!user || !user.token) {
        throw new Error('No authentication found');
      }

      if (endpoint.includes('undefined')) {
        throw new Error('Invalid endpoint: user ID is undefined');
      }

      console.log('Fetching from endpoint:', endpoint);

      const response = await fetch(
        `http://${config.server_host}:${config.server_port}${endpoint}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
    }
  }, [user]);

  const handleSort = (column) => {
    const isAsc = orderBy === column && orderDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    setOrderDirection(newDirection);
    setOrderBy(column);

    const sortedInstances = [...instances].sort((a, b) => {
      // Handle null or undefined values
      if (!a[column]) return 1;
      if (!b[column]) return -1;

      let compareA = a[column];
      let compareB = b[column];

      // Determine if the column contains numeric values
      const numericColumns = ['cpucorecount', 'memory', 'storage', 'priceperhour'];
      
      if (numericColumns.includes(column)) {
        // Convert to numbers for numeric comparison
        compareA = Number(compareA);
        compareB = Number(compareB);
      } else {
        compareA = String(compareA).toLowerCase();
        compareB = String(compareB).toLowerCase();
      }

      // Sort based on direction
      if (newDirection === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });
    
    setInstances(sortedInstances);
  };

  const SortableTableCell = ({ column, children }) => (
    <TableCell
      onClick={() => handleSort(column)}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {children}
        {orderBy === column ? (
          <span>
            {orderDirection === 'asc' ? (
              <ArrowUpwardIcon fontSize="small" color="primary" />
            ) : (
              <ArrowDownwardIcon fontSize="small" color="primary" />
            )}
          </span>
        ) : (
          <ArrowUpwardIcon fontSize="small" sx={{ opacity: 0.3 }} />
        )}
      </div>
    </TableCell>
  );

  useEffect(() => {
    const loadData = async () => {
      if (!user || !user.userId) {
        console.log('No user ID available:', user);
        return;
      }

      try {
        console.log('Current user:', user);
        
        const instancesData = await fetchData(`/api/user/instances/${user.userId}`);
        console.log('User instances:', instancesData);

        if (instancesData && Array.isArray(instancesData)) {
          const initialRunningState = {};
          instancesData.forEach(instance => {
            initialRunningState[instance.instancename] = instance.status === 'running';
          });
          setInstances(instancesData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [user, fetchData]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Instances
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <span onClick={() => handleSort('instancename')} style={{ cursor: 'pointer' }}></span>
                <span>Instance Name</span>
                <SortableTableCell column="instancename" />
              </TableCell>
              <TableCell>
                <span onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}></span>
                <span>Type</span>
                <SortableTableCell column="type" />
              </TableCell>
              <TableCell>
                <span onClick={() => handleSort('systemtype')} style={{ cursor: 'pointer' }}></span>
                <span>System</span>
                <SortableTableCell column="systemtype" />
              </TableCell>
              <TableCell>
                <span onClick={() => handleSort('ipaddress')} style={{ cursor: 'pointer' }}></span>
                <span>IP Address</span> 
                <SortableTableCell column="ipaddress" />
              </TableCell>
              <TableCell>
                <span onClick={() => handleSort('allocated_username')} style={{ cursor: 'pointer' }}></span>
                <span>Allocated Username</span>
                <SortableTableCell column="allocated_username" />
              </TableCell>
              <TableCell>
                <span onClick={() => handleSort('allocateduserid')} style={{ cursor: 'pointer' }}></span>
                <span>Allocated UserId</span>
                <SortableTableCell column="allocateduserid" />
              </TableCell>
              <TableCell>
                <span onClick={() => handleSort('cpucorecount')} style={{ cursor: 'pointer' }}></span>  
                <span>CPU Cores</span>
                <SortableTableCell column="cpucorecount" />
              </TableCell>
              <TableCell>
                <span onClick={() => handleSort('memory')} style={{ cursor: 'pointer' }}></span>
                <span>Memory (GB)</span>
                <SortableTableCell column="memory" />
              </TableCell>
              <TableCell>
                <span onClick={() => handleSort('storage')} style={{ cursor: 'pointer' }}></span>
                <span>Storage (GB)</span>
                <SortableTableCell column="storage" />
              </TableCell>
              <TableCell>
                <span onClick={() => handleSort('priceperhour')} style={{ cursor: 'pointer' }}></span>
                <span>Price/Hour</span>
                <SortableTableCell column="priceperhour" />
              </TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instances.map((instance) => (
              <TableRow key={instance.instanceid}>
                <TableCell>{instance.instancename}</TableCell>
                <TableCell>{instance.type}</TableCell>
                <TableCell>{instance.systemtype}</TableCell>
                <TableCell>{instance.ipaddress}</TableCell>
                <TableCell>{instance.allocated_username || 'N/A'}</TableCell>
                <TableCell>{instance.allocateduserid || 'N/A'}</TableCell>
                <TableCell>{instance.cpucorecount}</TableCell>
                <TableCell>{instance.memory}</TableCell>
                <TableCell>{instance.storage}</TableCell>
                <TableCell>${instance.priceperhour}/hr</TableCell>
                <TableCell align="center">
                  <FiberManualRecordIcon
                    sx={{
                      color: instance.status ? 'success.main' : 'error.main',
                      fontSize: '12px'
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}