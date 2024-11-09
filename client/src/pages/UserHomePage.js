import { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TimerIcon from '@mui/icons-material/Timer';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import CostChart from '../components/CostChart';
import CumulativeCostChart from '../components/CumulativeCostChart';
import UptimeChart from '../components/UptimeChart';

const formatUsageTime = (hours) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)} mins`;
  } else if (hours < 24) {
    return `${Math.round(hours * 10) / 10} hrs`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round((hours % 24) * 10) / 10;
    return remainingHours > 0 ? 
      `${days}d ${remainingHours}h` : 
      `${days}d`;
  }
};

export default function UserHomePage() {
  const [instanceCount, setInstanceCount] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [hourlyData, setHourlyData] = useState([]);
  const [cumulativeCosts, setCumulativeCosts] = useState(null);
  const [uptimeData, setUptimeData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchInstanceCount = async () => {
      try {
        const userId = user.userId; // Assuming you store userId in localStorage
        const response = await fetch(`http://${config.server_host}:${config.server_port}/api/user/count/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming you store token in localStorage
          }
        });
        const data = await response.json();
        setInstanceCount(data.count);
      } catch (error) {
        console.error('Error fetching instance count:', error);
      }
    };

    fetchInstanceCount();
  }, []);

  useEffect(() => {
    const fetchTotalCost = async () => {
      try {
        const response = await fetch(`http://${config.server_host}:${config.server_port}/api/user/total-cost/${user.userId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        const data = await response.json();
        setTotalCost(data.totalCost);
      } catch (error) {
        console.error('Error fetching total cost:', error);
      }
    };

    if (user?.userId) {
      fetchTotalCost();
    }
  }, [user]);

  useEffect(() => {
    const fetchTotalUsage = async () => {
      try {
        const response = await fetch(`http://${config.server_host}:${config.server_port}/api/user/total-usage/${user.userId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        const data = await response.json();
        setTotalHours(data.totalHours);
      } catch (error) {
        console.error('Error fetching total usage:', error);
      }
    };

    if (user?.userId) {
      fetchTotalUsage();
    }
  }, [user]);

  useEffect(() => {
    const fetchHourlyCosts = async () => {
      try {
        const response = await fetch(`http://${config.server_host}:${config.server_port}/api/user/hourly-costs/${user.userId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        const data = await response.json();
        setHourlyData(data.hourlyData);
      } catch (error) {
        console.error('Error fetching hourly costs:', error);
      }
    };

    if (user?.userId) {
      fetchHourlyCosts();
      // Refresh data every 5 minutes
      const interval = setInterval(fetchHourlyCosts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const fetchCumulativeCosts = async () => {
      try {
        const response = await fetch(
          `http://${config.server_host}:${config.server_port}/api/user/cumulative-costs/${user.userId}`,
          {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          }
        );
        const data = await response.json();
        setCumulativeCosts(data);
      } catch (error) {
        console.error('Error fetching cumulative costs:', error);
      }
    };

    if (user?.userId) {
      fetchCumulativeCosts();
      const interval = setInterval(fetchCumulativeCosts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const fetchUptimeData = async () => {
      try {
        const response = await fetch(
          `http://${config.server_host}:${config.server_port}/api/user/uptime/${user.userId}`,
          {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          }
        );
        const data = await response.json();
        setUptimeData(data);
      } catch (error) {
        console.error('Error fetching uptime data:', error);
      }
    };

    if (user?.userId) {
      fetchUptimeData();
      const interval = setInterval(fetchUptimeData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <Container style={{ marginTop: '2rem' }}>
      <Typography variant="h2" align="center" gutterBottom style={{ fontWeight: 'bold', color: '#333' }}>
        Welcome to your cluster!
      </Typography>
      <Typography variant="subtitle1" align="center" gutterBottom style={{ color: '#666', marginBottom: '2rem' }}>
        Here is an overview of your usage and billing statistics.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Existing Instance Count Widget */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: '300px' }}>
          <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <ComputerIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              {instanceCount}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Total Instances
            </Typography>
          </Box>
        </Paper>

        {/* Total Cost Widget */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: '300px' }}>
          <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <AttachMoneyIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              ${totalCost}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Total Cost
            </Typography>
          </Box>
        </Paper>

        {/* Updated Total Usage Widget */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: '300px' }}>
          <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <TimerIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              {formatUsageTime(parseFloat(totalHours))}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Total Usage Time
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Cost Over Time
        </Typography>
        <Box sx={{ height: '500px' }}>
          <CostChart data={hourlyData} />
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Cumulative Cost per Instance
        </Typography>
        <Box sx={{ height: '500px' }}>
          <CumulativeCostChart data={cumulativeCosts} />
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Instance Uptime per Hour
        </Typography>
        <Box sx={{ height: '500px' }}>
          <UptimeChart data={uptimeData} />
        </Box>
      </Paper>
    </Container>
  );
}
