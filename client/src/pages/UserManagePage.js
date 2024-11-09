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
  Box,
  Button,
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
  const [orderBy, setOrderBy] = useState('');
  const [orderDirection, setOrderDirection] = useState('asc');
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
        const instancesData = await fetchData(`/api/user/instances/${user.userId}`);
        console.log('User instances:', instancesData);

        if (instancesData && Array.isArray(instancesData)) {
          const initialRunningState = {};
          instancesData.forEach(instance => {
            initialRunningState[instance.instancename] = instance.booted;
          });
          setRunningInstances(initialRunningState);
          setInstances(instancesData);
        }
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
      </Box>

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