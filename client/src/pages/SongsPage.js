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
  Tab
} from '@mui/material';

export default function InstanceManagementPage() {
  const { user } = useAuth();
  const [instances, setInstances] = useState([]);
  const [instanceTypes, setInstanceTypes] = useState([]);
  const [priceTiers, setPriceTiers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [activeTab, setActiveTab] = useState('instances');
  const [formData, setFormData] = useState({
    instanceName: '',
    instanceTypeId: '',
    username: '',
    password: '',
    ipAddress: '',
    booted: false
  });

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
        const [instancesData, typesData, tiersData] = await Promise.all([
          fetchData('/api/owner/instances'),
          fetchData('/api/owner/instance-types'),
          fetchData('/api/owner/price-tiers')
        ]);

        setInstances(instancesData);
        setInstanceTypes(typesData);
        setPriceTiers(tiersData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [user, fetchData]);

  const handleToggleStatus = async (instance) => {
    try {
      const response = await fetch(
        `http://${config.server_host}:${config.server_port}/api/owner/instances/${instance.instanceid}/toggle`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedInstances = await fetchData('/api/owner/instances');
      setInstances(updatedInstances);
    } catch (error) {
      console.error('Error toggling instance status:', error);
    }
  };

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
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.instanceid}>
                    <TableCell>{instance.instancename}</TableCell>
                    <TableCell>{instance.type}</TableCell>
                    <TableCell>{instance.systemtype}</TableCell>
                    <TableCell>{instance.cpucorecount}</TableCell>
                    <TableCell>{instance.memory}</TableCell>
                    <TableCell>{instance.storage}</TableCell>
                    <TableCell>{instance.price_tier}</TableCell>
                    <TableCell>${instance.priceperhour}/hr</TableCell>
                    <TableCell>{instance.status ? 'Running' : 'Stopped'}</TableCell>
                    <TableCell>
                      <Button variant="outlined" color="primary" onClick={() => handleOpenDialog(instance)} sx={{ mr: 1 }}>
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color={instance.status ? 'warning' : 'success'}
                        onClick={() => handleToggleStatus(instance)}
                      >
                        {instance.status ? 'Stop' : 'Start'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Instance Types Table */}
      {activeTab === 'instanceTypes' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow key="header-instance-types">
                <TableCell key="type-name">Type Name</TableCell>
                <TableCell key="system-type">System Type</TableCell>
                <TableCell key="cpu-cores">CPU Cores</TableCell>
                <TableCell key="memory">Memory (GB)</TableCell>
                <TableCell key="storage">Storage (GB)</TableCell>
                <TableCell key="price-tier">Price Tier</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Price Tiers Table */}
      {activeTab === 'priceTiers' && (
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
                name="instanceTypeId"
                value={formData.instanceTypeId}
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
              name="ipAddress"
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
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedInstance ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}