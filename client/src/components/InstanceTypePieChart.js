import { Pie } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const getInstanceColors = (count) => {
  const colors = [
    'rgb(54, 162, 235)',   // Blue
    'rgb(255, 99, 132)',   // Pink
    'rgb(75, 192, 192)',   // Teal
    'rgb(255, 205, 86)',   // Yellow
    'rgb(153, 102, 255)',  // Purple
    'rgb(255, 159, 64)'    // Orange
  ];
  return colors.slice(0, count);
};

export default function InstanceTypePieChart({ data }) {
  if (!data?.instanceTypes) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Instance Type Distribution
        </Typography>
        <Typography color="text.secondary">
          No instance data available
        </Typography>
      </Box>
    );
  }

  const chartData = {
    labels: data.instanceTypes.map(type => type.name),
    datasets: [{
      data: data.instanceTypes.map(type => type.count),
      backgroundColor: getInstanceColors(data.instanceTypes.length),
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Instance Type Distribution',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <Box sx={{ height: 400, position: 'relative' }}>
      <Pie data={chartData} options={options} />
    </Box>
  );
} 