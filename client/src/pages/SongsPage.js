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
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

export default function InstanceManagementPage() {
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
                  <TableCell align="center">Status</TableCell>
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
    </Container>
  );
}