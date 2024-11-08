import { useEffect, useState } from 'react';
import { Container, Grid, Box, Typography } from '@mui/material';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export default function UserHomePage() {
  const [usageByInstance, setUsageByInstance] = useState([]);
  const [averageUsagePerUser, setAverageUsagePerUser] = useState([]);
  const [dailyUsageTrend, setDailyUsageTrend] = useState([]);
  const [usageBySystemType, setUsageBySystemType] = useState([]);
  const [costByUser, setCostByUser] = useState([]);

  useEffect(() => {
    // Dummy data for each visualization
    setUsageByInstance([
      { instance_id: 1, total_usage_hours: 20 },
      { instance_id: 2, total_usage_hours: 35 },
      { instance_id: 3, total_usage_hours: 50 },
      { instance_id: 4, total_usage_hours: 15 },
      { instance_id: 5, total_usage_hours: 40 },
    ]);

    setAverageUsagePerUser([
      { user_id: 1, avg_session_duration: 3 },
      { user_id: 2, avg_session_duration: 4.5 },
      { user_id: 3, avg_session_duration: 2 },
      { user_id: 4, avg_session_duration: 5.2 },
    ]);

    setDailyUsageTrend([
      { usage_date: '2024-10-01', total_usage_hours: 10 },
      { usage_date: '2024-10-02', total_usage_hours: 20 },
      { usage_date: '2024-10-03', total_usage_hours: 15 },
      { usage_date: '2024-10-04', total_usage_hours: 30 },
      { usage_date: '2024-10-05', total_usage_hours: 25 },
    ]);

    setUsageBySystemType([
      { system_type: 'Linux', total_usage_hours: 100 },
      { system_type: 'Windows', total_usage_hours: 80 },
      { system_type: 'MacOS', total_usage_hours: 50 },
    ]);

    setCostByUser([
      { user_id: 1, total_cost: 150 },
      { user_id: 2, total_cost: 200 },
      { user_id: 3, total_cost: 120 },
      { user_id: 4, total_cost: 300 },
    ]);
  }, []);

  // Chart data configurations
  const usageByInstanceData = {
    labels: usageByInstance.map(item => `Instance ${item.instance_id}`),
    datasets: [
      {
        label: 'Total Usage Hours',
        data: usageByInstance.map(item => item.total_usage_hours),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const averageUsagePerUserData = {
    labels: averageUsagePerUser.map(item => `User ${item.user_id}`),
    datasets: [
      {
        label: 'Avg. Session Duration (Hours)',
        data: averageUsagePerUser.map(item => item.avg_session_duration),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  const dailyUsageTrendData = {
    labels: dailyUsageTrend.map(item => item.usage_date),
    datasets: [
      {
        label: 'Total Usage Hours',
        data: dailyUsageTrend.map(item => item.total_usage_hours),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };

  const usageBySystemTypeData = {
    labels: usageBySystemType.map(item => item.system_type),
    datasets: [
      {
        label: 'Total Usage Hours',
        data: usageBySystemType.map(item => item.total_usage_hours),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const costByUserData = {
    labels: costByUser.map(item => `User ${item.user_id}`),
    datasets: [
      {
        label: 'Total Cost ($)',
        data: costByUser.map(item => item.total_cost),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  return (
    <Container style={{ marginTop: '2rem' }}>
      {/* Title Section */}
      <Typography variant="h2" align="center" gutterBottom style={{ fontWeight: 'bold', color: '#333' }}>
        Welcome to your cluster!
      </Typography>
      <Typography variant="subtitle1" align="center" gutterBottom style={{ color: '#666', marginBottom: '2rem' }}>
        Here is an overview of your usage and billing statistics.
      </Typography>

      <Grid container spacing={3}>
        {/* Total Usage Time by Instance */}
        <Grid item xs={12} sm={6}>
          <Box style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <h3>Total Usage Time by Instance</h3>
            <Bar data={usageByInstanceData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </Box>
        </Grid>

        {/* Average Usage Time per User */}
        <Grid item xs={12} sm={6}>
          <Box style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <h3>Average Usage Time per User</h3>
            <Bar data={averageUsagePerUserData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </Box>
        </Grid>

        {/* Daily Usage Trend */}
        <Grid item xs={12} sm={6}>
          <Box style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <h3>Daily Usage Trend</h3>
            <Line data={dailyUsageTrendData} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { x: { title: { display: true, text: 'Date' } }, y: { title: { display: true, text: 'Usage Hours' } } } }} />
          </Box>
        </Grid>

        {/* Cost Analysis by User */}
        <Grid item xs={12} sm={6}>
          <Box style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <h3>Cost Analysis by User</h3>
            <Bar data={costByUserData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </Box>
        </Grid>

        {/* Usage Distribution by System Type */}
        <Grid item xs={12} sm={6}>
          <Box style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <h3>Usage Distribution by System Type</h3>
            <Pie data={usageBySystemTypeData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
