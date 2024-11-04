import { useEffect, useState } from 'react';
import { Checkbox, Container, Grid, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const config = require('../config.json');

export default function InstancesPage() {
  const [pageSize, setPageSize] = useState(10);
  const [instanceData, setInstanceData] = useState([]);
  const [instanceTypeData, setInstanceTypeData] = useState([]);
  const [priceTierData, setPriceTierData] = useState([]);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({});

  // Fetch data for each table
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/search_instances`)
      .then(res => res.json())
      .then(resJson => {
        const instancesWithId = resJson.map((instance) => ({ id: instance.InstanceId, ...instance }));
        setInstanceData(instancesWithId);
      });
  }, []);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/search_instance_types`)
      .then(res => res.json())
      .then(resJson => {
        const instanceTypesWithId = resJson.map((type) => ({ id: type.InstanceTypeId, ...type }));
        setInstanceTypeData(instanceTypesWithId);
      });
  }, []);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/search_price_tiers`)
      .then(res => res.json())
      .then(resJson => {
        const priceTiersWithId = resJson.map((tier) => ({ id: tier.PriceTierId, ...tier }));
        setPriceTierData(priceTiersWithId);
      });
  }, []);

  // Handler for opening the dialog
  const handleOpenDialog = (type) => {
    setDialogType(type);
    setFormData({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = () => {
    console.log(`Submitting new ${dialogType}:`, formData);
    // Implement actual submission logic here (e.g., API call)
    handleCloseDialog();
  };

  // Define the columns for each table
  const priceTierColumns = [
    { field: 'PriceTierId', headerName: 'Price Tier ID', width: 150 },
    { field: 'price_tier', headerName: 'Price Tier', width: 200 },
    { field: 'PricePerHour', headerName: 'Price per Hour ($)', width: 150 },
  ];

  const instanceTypeColumns = [
    { field: 'InstanceTypeId', headerName: 'Instance Type ID', width: 150 },
    { field: 'InstanceType', headerName: 'Instance Type', width: 150 },
    { field: 'SystemType', headerName: 'System Type', width: 150 },
    { field: 'CPUCoreCount', headerName: 'CPU Cores', width: 120 },
    { field: 'Storage', headerName: 'Storage (GB)', width: 120 },
    { field: 'Memory', headerName: 'Memory (GB)', width: 120 },
  ];

  const instanceColumns = [
    { field: 'InstanceId', headerName: 'Instance ID', width: 100 },
    { field: 'InstanceType', headerName: 'Instance Type', width: 150 },
    { field: 'SystemType', headerName: 'System Type', width: 150 },
    { field: 'CPUCoreCount', headerName: 'CPU Cores', width: 120 },
    { field: 'Storage', headerName: 'Storage (GB)', width: 120 },
    { field: 'Memory', headerName: 'Memory (GB)', width: 120 },
    { field: 'IPAddress', headerName: 'IP Address', width: 150 },
    { field: 'Username', headerName: 'Username', width: 150 },
    { field: 'Booted', headerName: 'Booted', width: 100, renderCell: (params) => (
        <Checkbox checked={params.value} disabled />
    ) }
  ];

  // Function to render form fields based on dialog type
const renderFormFields = () => {
  let fields = [];
  if (dialogType === 'Price Tier') {
    fields = [
      { label: 'Price Tier', name: 'price_tier', type: 'text' },
      { label: 'Price per Hour', name: 'PricePerHour', type: 'number', inputProps: { min: 0, step: 0.01 } },
    ];
  } else if (dialogType === 'Instance Type') {
    fields = [
      { label: 'Instance Type', name: 'InstanceType', type: 'text' },
      { label: 'System Type', name: 'SystemType', type: 'text' },
      { label: 'CPU Cores', name: 'CPUCoreCount', type: 'number', inputProps: { min: 1, step: 1 } },
      { label: 'Storage (GB)', name: 'Storage', type: 'number', inputProps: { min: 1, step: 1 } },
      { label: 'Memory (GB)', name: 'Memory', type: 'number', inputProps: { min: 1, step: 1 } },
    ];
  } else if (dialogType === 'Instance') {
    fields = [
      { label: 'Instance Type', name: 'InstanceType', type: 'text' },
      { label: 'System Type', name: 'SystemType', type: 'text' },
      { label: 'CPU Cores', name: 'CPUCoreCount', type: 'number', inputProps: { min: 1, step: 1 } },
      { label: 'Storage (GB)', name: 'Storage', type: 'number', inputProps: { min: 1, step: 1 } },
      { label: 'Memory (GB)', name: 'Memory', type: 'number', inputProps: { min: 1, step: 1 } },
      { label: 'IP Address', name: 'IPAddress', type: 'text', pattern: "^((25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$" }, // Optional IP address regex pattern
      { label: 'Username', name: 'Username', type: 'text' },
      { label: 'Booted', name: 'Booted', type: 'checkbox' }, // Checkbox for boolean
    ];
  }

  return fields.map((field, index) => (
    <TextField
      key={index}
      label={field.label}
      name={field.name}
      type={field.type}
      fullWidth
      margin="dense"
      onChange={handleChange}
      inputProps={field.inputProps}
      {...(field.pattern && { inputProps: { pattern: field.pattern } })}
    />
  ));
};

  return (
    <Container>
      <Grid container spacing={2}>
        {/* Price Tiers Table */}
        <Grid item xs={6}>
          <h2>
            Price Tiers
            <Button
              variant="contained"
              color="primary"
              size="small"
              style={{ marginLeft: 10 }}
              onClick={() => handleOpenDialog('Price Tier')}
            >
              Add New
            </Button>
          </h2>
          <DataGrid
            rows={priceTierData}
            columns={priceTierColumns}
            pageSize={pageSize}
            rowsPerPageOptions={[5, 10, 25]}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            autoHeight
          />
        </Grid>

        {/* Instance Types Table */}
        <Grid item xs={6}>
          <h2>
            Instance Types
            <Button
              variant="contained"
              color="primary"
              size="small"
              style={{ marginLeft: 10 }}
              onClick={() => handleOpenDialog('Instance Type')}
            >
              Add New
            </Button>
          </h2>
          <DataGrid
            rows={instanceTypeData}
            columns={instanceTypeColumns}
            pageSize={pageSize}
            rowsPerPageOptions={[5, 10, 25]}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            autoHeight
          />
        </Grid>
      </Grid>

      <h2>
        Instance Results
        <Button
          variant="contained"
          color="primary"
          size="small"
          style={{ marginLeft: 10 }}
          onClick={() => handleOpenDialog('Instance')}
        >
          Add New
        </Button>
      </h2>
      <DataGrid
        rows={instanceData}
        columns={instanceColumns}
        pageSize={pageSize}
        rowsPerPageOptions={[5, 10, 25]}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        autoHeight
      />

      {/* Dialog for adding new entries */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add New {dialogType}</DialogTitle>
        <DialogContent>
          {renderFormFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">Cancel</Button>
          <Button onClick={handleFormSubmit} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
