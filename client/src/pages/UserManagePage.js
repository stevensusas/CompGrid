import { useState, useEffect, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
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
  Box,
  Button, 
  Modal, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl,
  InputLabel
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export default function UserManagePage() {
  const { user } = useAuth();
  const [instances, setInstances] = useState([]);
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    instancetype: ''
  });
  const [availableTypes, setAvailableTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderBy, setOrderBy] = useState('instancename');
  const [orderDirection, setOrderDirection] = useState('asc');
  
  // Predefined instance types
  const instanceTypes = [
    { name: 'ArchLinux Micro', system: 'ArchLinux', cpu: 1, memory: 1, storage: 15, tier: 'free' },
    { name: 'ArchLinux Macro', system: 'ArchLinux', cpu: 1, memory: 2, storage: 15, tier: 'paid' },
    { name: 'ArchLinux Mega', system: 'ArchLinux', cpu: 1, memory: 4, storage: 15, tier: 'paid' },
    { name: 'ArchLinux MegaX', system: 'ArchLinux', cpu: 1, memory: 6, storage: 15, tier: 'paid' }
  ];

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

  const fetchInstances = useCallback(async () => {
    if (!user || !user.userId) {
      console.log('No user ID available:', user);
      return;
    }

    try {
      const data = await fetchData(`/api/user/instances/${user.userId}`);
      console.log('Fetched instances:', data);
      
      const userInstances = Array.isArray(data) ? data.filter(instance => 
        instance.allocateduserid === user.userId
      ) : [];
      
      console.log('User instances:', userInstances);
      setInstances(userInstances);
    } catch (error) {
      console.error('Error loading instances:', error);
      setInstances([]);
    }
  }, [user, fetchData]);

  const fetchAvailableTypes = async () => {
    try {
      const data = await fetchData('/api/available-instance-types');
      console.log('Available types:', data);
      setAvailableTypes(data);
    } catch (error) {
      console.error('Error fetching instance types:', error);
    }
  };

  const handleRequestOpen = () => setOpenRequestModal(true);
  const handleRequestClose = () => {
    setOpenRequestModal(false);
    setRequestForm({
      instancetype: '',
      requestreason: ''
    });
  };

  const handleRequestChange = (event) => {
    setRequestForm({
      ...requestForm,
      [event.target.name]: event.target.value
    });
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${config.server_host}/api/request-instance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          instancetype: requestForm.instancetype
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request instance');
      }

      const data = await response.json();
      console.log('Instance allocated:', data);
      handleRequestClose();
      fetchInstances(); 
    } catch (error) {
      console.error('Error requesting instance:', error);
    } finally {
      setLoading(false);
    }
  };

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
    fetchInstances();
  }, [fetchInstances]);

  useEffect(() => {
    if (openRequestModal) {
      fetchAvailableTypes();
    }
  }, [openRequestModal]);

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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleRequestOpen}
        >
          Request Instance
        </Button>
      </Box>

      <Modal
        open={openRequestModal}
        onClose={handleRequestClose}
        aria-labelledby="request-instance-modal"
      >
        <Box
          component="form"
          onSubmit={handleRequestSubmit}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 1,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Request New Instance Type
          </Typography>

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="instancetype-label">Instance Type</InputLabel>
            <Select
              labelId="instancetype-label"
              name="instancetype"
              value={requestForm.instancetype}
              onChange={handleRequestChange}
              label="Instance Type"
            >
              {instanceTypes.map((type) => {
                // Find the matching available type from the backend
                const availableType = availableTypes.find(at => at.instancetype === type.name);
                
                return (
                  <MenuItem 
                    key={type.name} 
                    value={type.name}
                    disabled={!availableType || availableType.available_instances === 0}
                  >
                    <Box>
                      <Typography variant="subtitle1">
                        {type.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {`${type.memory}GB RAM, ${type.storage}GB Storage, ${type.tier} tier`}
                        {availableType && ` (${availableType.available_instances} available)`}
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Request Reason"
            name="requestreason"
            value={requestForm.requestreason}
            onChange={handleRequestChange}
            margin="normal"
            required
            multiline
            rows={4}
          />

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleRequestClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading || !requestForm.instancetype}
            >
              {loading ? 'Requesting...' : 'Request Instance'}
            </Button>
          </Box>
        </Box>
      </Modal>
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