import { useEffect, useState } from 'react';
import { Container, Grid, Box } from '@mui/material';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export default function BillingPage() {
  const [billingByUser, setBillingByUser] = useState([]);
  const [monthlyBillingTrend, setMonthlyBillingTrend] = useState([]);
  const [billingBySystemType, setBillingBySystemType] = useState([]);
  const [averageBillingByInstanceType, setAverageBillingByInstanceType] = useState([]);

  useEffect(() => {
    // Dummy data for each billing visualization

    // Total Billing Amount by User
    setBillingByUser([
      { user_id: 1, total_billing: 500 },
      { user_id: 2, total_billing: 750 },
      { user_id: 3, total_billing: 300 },
      { user_id: 4, total_billing: 620 },
    ]);

    // Monthly Billing Trend
    setMonthlyBillingTrend([
      { month: '2024-01', amount: 300 },
      { month: '2024-02', amount: 450 },
      { month: '2024-03', amount: 500 },
      { month: '2024-04', amount: 600 },
      { month: '2024-05', amount: 700 },
    ]);

    // Billing Distribution by System Type
    setBillingBySystemType([
      { system_type: 'Linux', total_billing: 1200 },
      { system_type: 'Windows', total_billing: 900 },
      { system_type: 'MacOS', total_billing: 500 },
    ]);

    // Average Billing by Instance Type
    setAverageBillingByInstanceType([
      { instance_type: 'Standard', avg_billing: 150 },
      { instance_type: 'High-CPU', avg_billing: 220 },
      { instance_type: 'High-Memory', avg_billing: 300 },
    ]);
  }, []);

  // Chart data configurations

  const billingByUserData = {
    labels: billingByUser.map(item => `User ${item.user_id}`),
    datasets: [
      {
        label: 'Total Billing Amount ($)',
        data: billingByUser.map(item => item.total_billing),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  const monthlyBillingTrendData = {
    labels: monthlyBillingTrend.map(item => item.month),
    datasets: [
      {
        label: 'Monthly Billing Amount ($)',
        data: monthlyBillingTrend.map(item => item.amount),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };

  const billingBySystemTypeData = {
    labels: billingBySystemType.map(item => item.system_type),
    datasets: [
      {
        label: 'Total Billing Amount ($)',
        data: billingBySystemType.map(item => item.total_billing),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const averageBillingByInstanceTypeData = {
    labels: averageBillingByInstanceType.map(item => item.instance_type),
    datasets: [
      {
        label: 'Average Billing Amount ($)',
        data: averageBillingByInstanceType.map(item => item.avg_billing),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  return (
    <Container style={{ marginTop: '2rem' }}>
      <Grid container spacing={2}>
        {/* Total Billing Amount by User */}
        <Grid item xs={12} sm={6}>
          <Box style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
            <h3>Total Billing Amount by User</h3>
            <Bar data={billingByUserData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </Box>
        </Grid>

        {/* Monthly Billing Trend */}
        <Grid item xs={12} sm={6}>
          <Box style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
            <h3>Monthly Billing Trend</h3>
            <Line data={monthlyBillingTrendData} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { x: { title: { display: true, text: 'Month' } }, y: { title: { display: true, text: 'Amount ($)' } } } }} />
          </Box>
        </Grid>

        {/* Billing Distribution by System Type */}
        <Grid item xs={12} sm={6}>
          <Box style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
            <h3>Billing Distribution by System Type</h3>
            <Pie data={billingBySystemTypeData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </Box>
        </Grid>

        {/* Average Billing by Instance Type */}
        <Grid item xs={12} sm={6}>
          <Box style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
            <h3>Average Billing by Instance Type</h3>
            <Bar data={averageBillingByInstanceTypeData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
