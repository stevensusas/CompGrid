import { useState, useEffect, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';
import config from '../config';
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
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
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
  

  const instanceTypes = [
    { name: 'ArchLinux Micro', system: 'ArchLinux', cpu: 1, memory: 1, storage: 15, tier: 'free' },
    { name: 'ArchLinux Macro', system: 'ArchLinux', cpu: 1, memory: 2, storage: 15, tier: 'paid' },
    { name: 'ArchLinux Mega', system: 'ArchLinux', cpu: 1, memory: 4, storage: 15, tier: 'paid' },
    { name: 'ArchLinux MegaX', system: 'ArchLinux', cpu: 1, memory: 6, storage: 15, tier: 'paid' }
  ];
  const [connectionDetailsDialog, setConnectionDetailsDialog] = useState(false);
  const [selectedConnectionDetails, setSelectedConnectionDetails] = useState(null);
  const [loadingInstances, setLoadingInstances] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [runningInstances, setRunningInstances] = useState({});

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
      const data = await fetchData('/api/user/available-instance-types');
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
      const response = await fetch(
        `http://${config.server_host}:${config.server_port}/api/user/request-instance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            instancetype: requestForm.instancetype
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request instance');
      }

      const data = await response.json();
      console.log('Instance allocated:', data);

      if (data.instance) {
        setInstances(prevInstances => {
          const newInstance = {
            ...data.instance,
            allocateduserid: user.userId
          };
          console.log('Adding new instance:', newInstance);
          return [...prevInstances, newInstance];
        });
  
        setAvailableTypes(prevTypes => {
          return prevTypes.map(type => {
            if (type.instancetype === requestForm.instancetype) {
              return {
                ...type,
                free_count: type.free_count - 1,
                available_instances: type.available_instances - 1
              };
            }
            return type;
          });
        });
  
        setSnackbar({
          open: true,
          message: '✅ Instance allocated successfully!',
          severity: 'success'
        });
  
        handleRequestClose();
        await fetchAvailableTypes();
    }

    } catch (error) {
      console.error('Error requesting instance:', error);
      setSnackbar({
        open: true,
        message: '❌ Failed to request instance: ' + error.message,
        severity: 'error'
      });
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
    if (openRequestModal) {
      fetchAvailableTypes();
    }
  }, [openRequestModal]);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user || !user.userId) {
          console.log('No user found');
          return;
        }

        console.log('Current user:', user);
        console.log('User ID:', user.userId);
        
        // Use the user-specific endpoint
        const instancesData = await fetchData(`/api/user/instances/${user.userId}`);
        console.log('Fetched instances:', instancesData);
        
        // Filter instances for the current user (belt and suspenders)
        const userInstances = instancesData.filter(instance => 
          instance.allocateduserid === user.userId
        );
        
        setInstances(userInstances);

      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();

    const refreshInterval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(refreshInterval);
  }, [user, fetchData]);

  const handleOpenConnectionDetails = (instance) => {
    console.log('Opening connection details for instance:', instance); // Debug log
    setSelectedConnectionDetails(instance);
    setConnectionDetailsDialog(true);
  };

  const handleCloseConnectionDetails = () => {
    setConnectionDetailsDialog(false);
    setSelectedConnectionDetails(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleStartInstance = async (instanceName, instanceId) => {
    try {
      setLoadingInstances(prev => ({ ...prev, [instanceName]: true }));
      
      const response = await fetch(
        `http://${config.server_host}:${config.server_port}/api/user/instances/${instanceName}/start`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.ok) {
        setRunningInstances(prev => ({ ...prev, [instanceName]: true }));
        
        setSnackbar({
          open: true,
          message: '🚀 Instance started successfully!',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to start instance');
      }
    } catch (error) {
      console.error('Error starting instance:', error);
      setSnackbar({
        open: true,
        message: '❌ Failed to start instance',
        severity: 'error'
      });
    } finally {
      setLoadingInstances(prev => ({ ...prev, [instanceName]: false }));
    }
  };

  const handleStopInstance = async (instanceName, instanceId) => {
    try {
      setLoadingInstances(prev => ({ ...prev, [instanceName]: true }));
      
      const response = await fetch(
        `http://${config.server_host}:${config.server_port}/api/user/instances/${instanceName}/stop`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.ok) {
        setRunningInstances(prev => ({ ...prev, [instanceName]: false }));
        
        setSnackbar({
          open: true,
          message: '🛑 Instance stopped successfully!',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to stop instance');
      }
    } catch (error) {
      console.error('Error stopping instance:', error);
      setSnackbar({
        open: true,
        message: '❌ Failed to stop instance',
        severity: 'error'
      });
    } finally {
      setLoadingInstances(prev => ({ ...prev, [instanceName]: false }));
    }
  };

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
              <TableCell>Instance Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>System</TableCell>
              <TableCell>CPU Cores</TableCell>
              <TableCell>Memory (GB)</TableCell>
              <TableCell>Storage (GB)</TableCell>
              <TableCell>Price/Hour</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instances.map((instance) => (
              <TableRow key={instance.instanceid}>
                <TableCell>
                  <Button
                    sx={{ textTransform: 'none' }}
                    onClick={() => handleOpenConnectionDetails(instance)}
                  >
                    {instance.instancename}
                  </Button>
                </TableCell>
                <TableCell>{instance.type}</TableCell>
                <TableCell>{instance.systemtype}</TableCell>
                <TableCell>{instance.cpucorecount}</TableCell>
                <TableCell>{instance.memory}</TableCell>
                <TableCell>{instance.storage}</TableCell>
                <TableCell>${instance.priceperhour}/hr</TableCell>
                <TableCell align="center">
                  <FiberManualRecordIcon
                    sx={{
                      color: runningInstances[instance.instancename] ? 'success.main' : 'error.main',
                      fontSize: '12px'
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    {!runningInstances[instance.instancename] ? (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleStartInstance(instance.instancename, instance.instanceid)}
                        disabled={loadingInstances[instance.instancename]}
                        sx={{ minWidth: '80px' }}
                      >
                        {loadingInstances[instance.instancename] ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Start"
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleStopInstance(instance.instancename, instance.instanceid)}
                        disabled={loadingInstances[instance.instancename]}
                        sx={{ minWidth: '80px' }}
                      >
                        {loadingInstances[instance.instancename] ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Stop"
                        )}
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Connection Details Dialog */}
      <Dialog
        open={connectionDetailsDialog}
        onClose={handleCloseConnectionDetails}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Connection Details for {selectedConnectionDetails?.instancename}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>IP Address:</strong> {selectedConnectionDetails?.ipaddress || 'Not available'}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Username:</strong> {selectedConnectionDetails?.username || 'Not available'}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Password:</strong> {selectedConnectionDetails?.password || 'Not available'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConnectionDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            fontSize: '1rem',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}