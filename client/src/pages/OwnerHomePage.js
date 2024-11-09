import { useState, useEffect } from 'react';
import { Container, Typography, Paper, CircularProgress, Box, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StorageIcon from '@mui/icons-material/Storage';
import TimerIcon from '@mui/icons-material/Timer';
import config from '../config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function OwnerHomePage() {
  const [stats, setStats] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const [runtimeByType, setRuntimeByType] = useState(null);
  const [costByType, setCostByType] = useState(null);
  const [topUsers, setTopUsers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, earningsResponse, runtimeResponse, runtimeTypeResponse, costTypeResponse, topUsersResponse] = await Promise.all([
          fetch(`http://${config.server_host}:${config.server_port}/api/owner/cluster-stats`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`http://${config.server_host}:${config.server_port}/api/owner/earnings-stats`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`http://${config.server_host}:${config.server_port}/api/owner/runtime-stats`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`http://${config.server_host}:${config.server_port}/api/owner/runtime-by-type`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`http://${config.server_host}:${config.server_port}/api/owner/cost-by-type`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`http://${config.server_host}:${config.server_port}/api/owner/top-users`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);

        const statsData = await statsResponse.json();
        const earningsData = await earningsResponse.json();
        const runtimeData = await runtimeResponse.json();
        const runtimeTypeData = await runtimeTypeResponse.json();
        const costTypeData = await costTypeResponse.json();
        const topUsersData = await topUsersResponse.json();

        setStats(statsData);
        setEarnings(earningsData);
        setRuntime(runtimeData);
        setRuntimeByType(runtimeTypeData);
        setCostByType(costTypeData);
        setTopUsers(topUsersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to format hours into a readable string
  const formatHours = (hours) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${remainingHours}h`;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const runtimeChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Instance Runtime by Type (Last 30 Days)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  const costChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Cumulative Cost by Instance Type (Last 30 Days)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cumulative Cost ($)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  return (
    <Container style={{ marginTop: '2rem' }}>
      <Typography variant="h2" align="center" gutterBottom style={{ fontWeight: 'bold', color: '#333' }}>
        Welcome to your cluster!
      </Typography>
      <Typography variant="subtitle1" align="center" gutterBottom style={{ color: '#666', marginBottom: '2rem' }}>
        Here is an overview of your usage and billing statistics.
      </Typography>
      
      {/* Stats Widgets Row */}
      <Grid container spacing={3} style={{ marginBottom: '2rem' }}>
        {/* Cluster Utilization Widget */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} style={{ padding: '2rem', height: '100%' }}>
            {loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : stats && (
              <Box textAlign="center">
                <StorageIcon color="primary" style={{ fontSize: 40, marginBottom: '1rem' }} />
                <Typography variant="h4" gutterBottom color="primary">
                  Cluster Utilization
                </Typography>
                <Typography variant="h2" color="secondary" style={{ marginBottom: '1rem' }}>
                  {stats.assignmentPercentage}%
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {stats.assignedInstances} out of {stats.totalInstances} instances assigned
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Total Earnings Widget */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} style={{ padding: '2rem', height: '100%' }}>
            {loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : earnings && (
              <Box textAlign="center">
                <AttachMoneyIcon color="primary" style={{ fontSize: 40, marginBottom: '1rem' }} />
                <Typography variant="h4" gutterBottom color="primary">
                  Total Earnings
                </Typography>
                <Typography variant="h2" color="secondary" style={{ marginBottom: '1rem' }}>
                  ${earnings.totalEarnings}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Total revenue from all instances
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Total Runtime Widget */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} style={{ padding: '2rem', height: '100%' }}>
            {loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : runtime && (
              <Box textAlign="center">
                <TimerIcon color="primary" style={{ fontSize: 40, marginBottom: '1rem' }} />
                <Typography variant="h4" gutterBottom color="primary">
                  Total Runtime
                </Typography>
                <Typography variant="h2" color="secondary" style={{ marginBottom: '1rem' }}>
                  {formatHours(runtime.totalHours)}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Total runtime of all instances
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} style={{ marginBottom: '2rem' }}>
        {/* Runtime Chart */}
        <Grid item xs={12}>
          <Paper elevation={3} style={{ padding: '2rem' }}>
            {loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : runtimeByType && (
              <Box style={{ height: '400px' }}>
                <Line 
                  options={runtimeChartOptions} 
                  data={{
                    ...runtimeByType,
                    datasets: runtimeByType.datasets.map((dataset, index) => ({
                      ...dataset,
                      borderColor: [
                        '#3f51b5',
                        '#f50057',
                        '#00bcd4',
                        '#4caf50',
                        '#ff9800',
                        '#9c27b0'
                      ][index % 6],
                      borderWidth: 2,
                      pointRadius: 3
                    }))
                  }} 
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Cost Chart */}
        <Grid item xs={12}>
          <Paper elevation={3} style={{ padding: '2rem' }}>
            {loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : costByType && (
              <Box style={{ height: '400px' }}>
                <Line 
                  options={costChartOptions} 
                  data={{
                    ...costByType,
                    datasets: costByType.datasets.map((dataset, index) => ({
                      ...dataset,
                      borderColor: [
                        '#3f51b5',
                        '#f50057',
                        '#00bcd4',
                        '#4caf50',
                        '#ff9800',
                        '#9c27b0'
                      ][index % 6],
                      borderWidth: 2,
                      pointRadius: 3
                    }))
                  }} 
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Top Users Table Row */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} style={{ padding: '2rem' }}>
            <Typography variant="h4" gutterBottom color="primary" align="center">
              Top Users by Usage
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : topUsers && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell align="right">Total Runtime</TableCell>
                      <TableCell align="right">Total Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topUsers.map((user, index) => (
                      <TableRow 
                        key={user.userid}
                        sx={{ 
                          backgroundColor: index < 3 ? 'rgba(63, 81, 181, 0.08)' : 'inherit'
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell align="right">{formatHours(user.total_hours)}</TableCell>
                        <TableCell align="right">${Number(user.total_cost).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
