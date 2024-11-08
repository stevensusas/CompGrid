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

export default function UserManagePage() {
  const { user } = useAuth();
  const [instances, setInstances] = useState([]);

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
        const instancesData = await fetchData('/api/user/instances');
        setInstances(instancesData);
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
    </Container>
  );
}