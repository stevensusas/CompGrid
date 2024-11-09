import { useState, useEffect, useCallback } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { styled } from '@mui/material/styles';

// Add this styled component for custom progress bar
const CustomLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.MuiLinearProgress-colorPrimary`]: {
    backgroundColor: theme.palette.grey[200],
  },
  [`& .MuiLinearProgress-bar`]: {
    borderRadius: 5,
    backgroundColor: theme.palette.primary.main,
  },
}));

export default function OwnerManagePage() {
  const { user } = useAuth();
  const [instances, setInstances] = useState([]);
  const [instanceTypes, setInstanceTypes] = useState([]);
  const [priceTiers, setPriceTiers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openInstanceTypeDialog, setOpenInstanceTypeDialog] = useState(false);
  const [openPriceTierDialog, setOpenPriceTierDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [activeTab, setActiveTab] = useState('instances');
  const [formData, setFormData] = useState({
    instanceName: '',
    instanceType: '',
    priceTier: '',
    status: 'running'
  });

  const [instanceTypeForm, setInstanceTypeForm] = useState({
    instanceType: '',
    systemType: '',
    cpuCoreCount: '',
    memory: '',
    storage: '',
    priceTierId: null
  });

  const [priceTierForm, setPriceTierForm] = useState({
    tierName: '',
    pricePerHour: ''
  });

  const [users, setUsers] = useState([]);

  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({
    userId: '',
    instanceId: ''
  });
  const [unassignedInstances, setUnassignedInstances] = useState([]);

  const [userDetailsDialog, setUserDetailsDialog] = useState(false);
  const [selectedUserInstances, setSelectedUserInstances] = useState([]);
  const [selectedUserName, setSelectedUserName] = useState('');

  const [connectionDetailsDialog, setConnectionDetailsDialog] = useState(false);
  const [selectedConnectionDetails, setSelectedConnectionDetails] = useState(null);

  const [controlEndpoints, setControlEndpoints] = useState({
    startEndpoint: '',
    stopEndpoint: ''
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' // or 'error'
  });

  // Add loading state for buttons
  const [loadingInstances, setLoadingInstances] = useState({});

  // Add a new state to track running instances
  const [runningInstances, setRunningInstances] = useState({});

  const fetchData = useCallback(async (endpoint) => {
    try {
      if (!user || !user.token) {
        throw new Error('No authentication found');
      }

      const response = await fetch(`http://${config.server_host}:${config.server_port}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        console.error('Response status:', response.status);
        console.error('Response headers:', response.headers);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [instancesData, typesData, tiersData, usersData, endpointsData] = await Promise.all([
          fetchData('/api/owner/instances'),
          fetchData('/api/owner/instance-types'),
          fetchData('/api/owner/price-tiers'),
          fetchData('/api/owner/users'),
          fetchData('/api/owner/control-endpoints')
        ]);

        console.log('Fetched instances:', instancesData); // Debug log
        setInstances(instancesData);
        setInstanceTypes(typesData);
        setPriceTiers(tiersData);
        setUsers(usersData);
        setControlEndpoints(endpointsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [user, fetchData]);

  const handleOpenDialog = (instance = null) => {
    if (instance) {
      setSelectedInstance(instance);
      setFormData({
        instanceName: instance.name,
        instanceType: instance.type,
        priceTier: instance.priceTier,
        status: instance.status
      });
    } else {
      setSelectedInstance(null);
      setFormData({
        instanceName: '',
        instanceType: '',
        priceTier: '',
        status: 'running'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInstance(null);
    setFormData({
      instanceName: '',
      instanceType: '',
      priceTier: '',
      status: 'running'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleCloseDialog();
  };

  const handleOpenInstanceTypeDialog = () => {
    setInstanceTypeForm({
      instanceType: '',
      systemType: '',
      cpuCoreCount: '',
      memory: '',
      storage: '',
      priceTierId: null
    });
    setOpenInstanceTypeDialog(true);
  };

  const handleCloseInstanceTypeDialog = () => {
    setOpenInstanceTypeDialog(false);
  };

  const handleOpenPriceTierDialog = () => {
    setPriceTierForm({
      tierName: '',
      pricePerHour: ''
    });
    setOpenPriceTierDialog(true);
  };

  const handleClosePriceTierDialog = () => {
    setOpenPriceTierDialog(false);
  };

  const handleInstanceTypeFormChange = (e) => {
    const { name, value } = e.target;
    console.log('Selected Value:', value); // For debugging
    setInstanceTypeForm((prev) => ({
      ...prev,
      [name]: value === '' ? null : Number(value),
    }));
  };

  const handlePriceTierFormChange = (e) => {
    const { name, value } = e.target;
    setPriceTierForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInstanceSubmit = async (e) => {
    e.preventDefault();
    console.log("FormData:", formData);
    try {
      const response = await fetch(`http://${config.server_host}:${config.server_port}/api/owner/instance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Refresh instance types data
        const updatedInstances = await fetchData('/api/owner/instances');
        setInstances(updatedInstances);
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error creating instance type:', error);
    }
  };

  const handleInstanceTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://${config.server_host}:${config.server_port}/api/owner/instance-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(instanceTypeForm)
      });

      if (response.ok) {
        // Refresh instance types data
        const updatedTypes = await fetchData('/api/owner/instance-types');
        setInstanceTypes(updatedTypes);
        handleCloseInstanceTypeDialog();
      }
    } catch (error) {
      console.error('Error creating instance type:', error);
    }
  };

  const handlePriceTierSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://${config.server_host}:${config.server_port}/api/owner/price-tiers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(priceTierForm)
      });

      if (response.ok) {
        // Refresh price tiers data
        const updatedTiers = await fetchData('/api/owner/price-tiers');
        setPriceTiers(updatedTiers);
        handleClosePriceTierDialog();
      } else {
        const errorData = await response.json();
        console.error('Error creating price tier:', errorData.message);
        // Optionally, display an error message to the user
      }
    } catch (error) {
      console.error('Error creating price tier:', error);
    }
  };

  const handleOpenAssignDialog = (userId) => {
    console.log('Opening dialog for user:', userId); // Debug log
    setAssignForm(prev => ({ ...prev, userId }));
    // Filter for unassigned instances
    const available = instances.filter(instance => !instance.allocateduserid);
    setUnassignedInstances(available);
    setOpenAssignDialog(true);
  };

  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false);
    setAssignForm({ userId: '', instanceId: '' });
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://${config.server_host}:${config.server_port}/api/owner/assign-instance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(assignForm)
      });

      if (response.ok) {
        // Refresh both instances and users data
        const [updatedInstances, updatedUsers] = await Promise.all([
          fetchData('/api/owner/instances'),
          fetchData('/api/owner/users')
        ]);
        setInstances(updatedInstances);
        setUsers(updatedUsers);
        handleCloseAssignDialog();
      }
    } catch (error) {
      console.error('Error assigning instance:', error);
    }
  };

  const handleOpenUserDetails = async (userId, username) => {
    try {
      const userInstances = await fetchData(`/api/owner/user/${userId}/instances`);
      console.log('Fetched user instances:', userInstances);
      setSelectedUserInstances(userInstances);
      setSelectedUserName(username);
      setUserDetailsDialog(true);
    } catch (error) {
      console.error('Error fetching user instances:', error);
    }
  };

  const handleCloseUserDetails = () => {
    setUserDetailsDialog(false);
    setSelectedUserInstances([]);
    setSelectedUserName('');
  };

  const handleOpenConnectionDetails = (instance) => {
    setSelectedConnectionDetails(instance);
    setConnectionDetailsDialog(true);
  };

  const handleCloseConnectionDetails = () => {
    setConnectionDetailsDialog(false);
    setSelectedConnectionDetails(null);
  };

  const handleEndpointChange = (e) => {
    const { name, value } = e.target;
    setControlEndpoints(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleEndpointSubmit = async () => {
    try {
      const response = await fetch(`http://${config.server_host}:${config.server_port}/api/owner/control-endpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(controlEndpoints)
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: '🚀 Control endpoints saved successfully!',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to save endpoints');
      }
    } catch (error) {
      console.error('Error saving endpoints:', error);
      setSnackbar({
        open: true,
        message: '❌ Failed to save endpoints. Please try again.',
        severity: 'error'
      });
    }
  };

  // Add this helper function to fetch instances
  const refreshInstances = async () => {
    try {
      const response = await fetch(
        `http://${config.server_host}:${config.server_port}/api/owner/instances`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setInstances(data);
      }
    } catch (error) {
      console.error('Error refreshing instances:', error);
    }
  };

  const handleStartInstance = async (instanceName) => {
    try {
      setLoadingInstances(prev => ({ ...prev, [instanceName]: true }));
      
      const response = await fetch(
        `http://${config.server_host}:${config.server_port}/api/owner/instances/${instanceName}/start`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.ok) {
        // Update local running state
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

  const handleStopInstance = async (instanceName) => {
    try {
      setLoadingInstances(prev => ({ ...prev, [instanceName]: true }));
      
      const response = await fetch(
        `http://${config.server_host}:${config.server_port}/api/owner/instances/${instanceName}/stop`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.ok) {
        // Update local running state
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
          Cluster Management
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Instances" value="instances" />
            <Tab label="Instance Types" value="instanceTypes" />
            <Tab label="Price Tiers" value="priceTiers" />
            <Tab label="Users" value="users" />
            <Tab label="Control" value="control" />
          </Tabs>
        </Box>
      </Box>

      {/* Instances Table */}
      {activeTab === 'instances' && (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
            sx={{ mb: 2 }}
          >
            Create New Instance
          </Button>
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
                  <TableCell>Price Tier</TableCell>
                  <TableCell>Price/Hour</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instances.map((instance) => {
                  console.log('Rendering instance:', instance.instancename, 'booted:', instance.booted);
                  return (
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
                      <TableCell>{instance.price_tier}</TableCell>
                      <TableCell>${instance.priceperhour}/hr</TableCell>
                      <TableCell align="center">
                        <FiberManualRecordIcon
                          sx={{
                            color: instance.status ? 'success.main' : 'error.main',
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
                              onClick={() => handleStartInstance(instance.instancename)}
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
                              onClick={() => handleStopInstance(instance.instancename)}
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Instance Types Table */}
      {activeTab === 'instanceTypes' && (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenInstanceTypeDialog}
            sx={{ mb: 2 }}
          >
            Create New Instance Type
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type Name</TableCell>
                  <TableCell>System Type</TableCell>
                  <TableCell>CPU Cores</TableCell>
                  <TableCell>Memory (GB)</TableCell>
                  <TableCell>Storage (GB)</TableCell>
                  <TableCell>Price Tier</TableCell>
                  <TableCell>Availability</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instanceTypes.map((type) => (
                  <TableRow key={type.instancetypeid}>
                    <TableCell>{type.instancetype}</TableCell>
                    <TableCell>{type.systemtype}</TableCell>
                    <TableCell>{type.cpucorecount}</TableCell>
                    <TableCell>{type.memory}</TableCell>
                    <TableCell>{type.storage}</TableCell>
                    <TableCell>{type.price_tier}</TableCell>
                    <TableCell>
                      <Tooltip 
                        title={`${type.assigned_count} of ${type.total_instances} instances assigned`}
                        placement="top"
                      >
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                              {type.assigned_count}/{type.total_instances}
                            </Typography>
                          </Box>
                          <CustomLinearProgress
                            variant="determinate"
                            value={(type.assigned_count / type.total_instances) * 100}
                            sx={{
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: (type.assigned_count / type.total_instances) > 0.8 
                                  ? 'error.main' 
                                  : (type.assigned_count / type.total_instances) > 0.5 
                                    ? 'warning.main' 
                                    : 'success.main'
                              }
                            }}
                          />
                        </Box>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Price Tiers Table */}
      {activeTab === 'priceTiers' && (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenPriceTierDialog}
            sx={{ mb: 2 }}
          >
            Create New Price Tier
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow key="header-price-tiers">
                  <TableCell key="tier-name">Tier Name</TableCell>
                  <TableCell key="price-per-hour">Price per Hour</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceTiers.map((tier) => (
                  <TableRow key={tier.pricetierId}>
                    <TableCell>{tier.price_tier}</TableCell>
                    <TableCell>${tier.priceperhour}/hr</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Users Table */}
      {activeTab === 'users' && (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell align="right">Assigned Instances</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.userid}>
                    <TableCell>
                      <Button
                        sx={{ textTransform: 'none' }}
                        onClick={() => handleOpenUserDetails(user.userid, user.username)}
                      >
                        {user.username}
                      </Button>
                    </TableCell>
                    <TableCell align="right">{user.assigned_instances}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleOpenAssignDialog(user.userid)}
                      >
                        Assign Instance
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* User Details Dialog */}
          <Dialog 
            open={userDetailsDialog} 
            onClose={handleCloseUserDetails}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle>
              Instances Assigned to {selectedUserName}
            </DialogTitle>
            <DialogContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Instance Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>System</TableCell>
                      <TableCell>CPU Cores</TableCell>
                      <TableCell>Memory (GB)</TableCell>
                      <TableCell>Storage (GB)</TableCell>
                      <TableCell>Price Tier</TableCell>
                      <TableCell>Price/Hour</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedUserInstances.map((instance) => (
                      <TableRow key={instance.instanceid}>
                        <TableCell>{instance.instancename}</TableCell>
                        <TableCell>{instance.type}</TableCell>
                        <TableCell>{instance.systemtype}</TableCell>
                        <TableCell>{instance.cpucorecount}</TableCell>
                        <TableCell>{instance.memory}</TableCell>
                        <TableCell>{instance.storage}</TableCell>
                        <TableCell>{instance.price_tier}</TableCell>
                        <TableCell>${instance.priceperhour}/hr</TableCell>
                        <TableCell align="center">
                          <FiberManualRecordIcon
                            sx={{
                              color: instance.status === 'running' ? 'success.main' : 'error.main',
                              fontSize: '12px'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {selectedUserInstances.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No instances assigned to this user
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseUserDetails}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* Existing Assign Instance Dialog remains here */}
        </>
      )}

      {/* Control Tab */}
      {activeTab === 'control' && (
        <Box sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Instance Control Endpoints
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="Start Instance Endpoint"
              name="startEndpoint"
              value={controlEndpoints.startEndpoint}
              onChange={handleEndpointChange}
              variant="outlined"
              placeholder="Enter the endpoint URL for starting instances"
              helperText="Example: http://example.com/api/start-instance"
            />
            <TextField
              fullWidth
              label="Stop Instance Endpoint"
              name="stopEndpoint"
              value={controlEndpoints.stopEndpoint}
              onChange={handleEndpointChange}
              variant="outlined"
              placeholder="Enter the endpoint URL for stopping instances"
              helperText="Example: http://example.com/api/stop-instance"
            />
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleEndpointSubmit}
              disabled={!controlEndpoints.startEndpoint || !controlEndpoints.stopEndpoint}
              sx={{ mt: 2 }}
            >
              Save Endpoints
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            These endpoints will be used to control instance start/stop operations.
          </Typography>
        </Box>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedInstance ? 'Edit Instance' : 'Create New Instance'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Instance Name"
              name="instanceName"
              value={formData.instanceName}
              onChange={handleInputChange}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Instance Type</InputLabel>
              <Select
                name="instanceType"
                value={formData.instanceType}
                onChange={handleInputChange}
                label="Instance Type"
              >
                {instanceTypes.map((type) => (
                  <MenuItem key={type.instancetypeid} value={type.instancetypeid}>
                    {type.instancetype} ({type.systemtype}) - {type.cpucorecount} CPU, {type.memory}GB RAM
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="IP Address"
              name="ipAddress"  // Ensure this matches the formData field name
              value={formData.ipAddress}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleInstanceSubmit} variant="contained" color="primary">
            {selectedInstance ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openInstanceTypeDialog} onClose={handleCloseInstanceTypeDialog}>
        <DialogTitle>Create New Instance Type</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Instance Type Name"
              name="instanceType"
              value={instanceTypeForm.instanceType}
              onChange={handleInstanceTypeFormChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="System Type"
              name="systemType"
              value={instanceTypeForm.systemType}
              onChange={handleInstanceTypeFormChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="CPU Core Count"
              name="cpuCoreCount"
              type="number"
              value={instanceTypeForm.cpuCoreCount}
              onChange={handleInstanceTypeFormChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Memory (GB)"
              name="memory"
              type="number"
              value={instanceTypeForm.memory}
              onChange={handleInstanceTypeFormChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Storage (GB)"
              name="storage"
              type="number"
              value={instanceTypeForm.storage}
              onChange={handleInstanceTypeFormChange}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="price-tier-label">Price Tier</InputLabel>
              <Select
                labelId="price-tier-label"
                id="price-tier-select"
                name="priceTierId"
                value={instanceTypeForm.priceTierId ?? ''}
                onChange={handleInstanceTypeFormChange}
                label="Price Tier"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {priceTiers.map((tier) => (
                  <MenuItem
                    key={tier.pricetierId}
                    value={tier.pricetierId}
                  >
                    {tier.price_tier} (${tier.priceperhour}/hr)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInstanceTypeDialog}>Cancel</Button>
          <Button
            onClick={handleInstanceTypeSubmit}
            variant="contained"
            color="primary"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPriceTierDialog} onClose={handleClosePriceTierDialog}>
        <DialogTitle>Create New Price Tier</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handlePriceTierSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Tier Name"
              name="tierName"
              value={priceTierForm.tierName}
              onChange={handlePriceTierFormChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Price per Hour ($)"
              name="pricePerHour"
              type="number"
              value={priceTierForm.pricePerHour}
              onChange={handlePriceTierFormChange}
              margin="normal"
              required
              inputProps={{
                step: "0.01",
                min: "0"
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePriceTierDialog}>Cancel</Button>
          <Button onClick={handlePriceTierSubmit} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Instance Dialog - Make sure this is outside the TableContainer */}
      <Dialog 
        open={openAssignDialog} 
        onClose={() => setOpenAssignDialog(false)}
      >
        <DialogTitle>Assign Instance to User</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Instance</InputLabel>
              <Select
                value={assignForm.instanceId}
                onChange={(e) => setAssignForm(prev => ({ ...prev, instanceId: e.target.value }))}
                label="Instance"
              >
                {unassignedInstances.map((instance) => (
                  <MenuItem key={instance.instanceid} value={instance.instanceid}>
                    {instance.instancename} ({instance.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAssignSubmit} 
            variant="contained" 
            color="primary"
            disabled={!assignForm.instanceId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

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
              <strong>IP Address:</strong> {selectedConnectionDetails?.ipaddress}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Username:</strong> {selectedConnectionDetails?.username}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Password:</strong> {selectedConnectionDetails?.password}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConnectionDetails}>Close</Button>
        </DialogActions>
      </Dialog>

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