import { Line } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const getInstanceColor = (index) => {
  const colors = [
    'rgb(54, 162, 235)',   // Blue
    'rgb(255, 99, 132)',   // Pink
    'rgb(75, 192, 192)',   // Teal
    'rgb(255, 205, 86)',   // Yellow
    'rgb(153, 102, 255)',  // Purple
    'rgb(255, 159, 64)'    // Orange
  ];
  return colors[index % colors.length];
};

const formatUptime = (minutes) => {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export default function UptimeLineChart({ data }) {
  if (!data?.hours) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Uptime by Instance Type
        </Typography>
        <Typography color="text.secondary">
          No uptime data available
        </Typography>
      </Box>
    );
  }

  const chartData = {
    labels: data.hours.map(hour => {
      const date = new Date(hour);
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    }),
    datasets: data.instanceTypes.map((instanceType, index) => ({
      label: instanceType,
      data: data.hours.map(hour => {
        const uptimeMinutes = data.uptime[hour][instanceType];
        return formatUptime(uptimeMinutes);
      }),
      borderColor: getInstanceColor(index),
      backgroundColor: getInstanceColor(index),
      borderWidth: 2
    }))
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Uptime by Instance Type
      </Typography>
      <Line data={chartData} />
    </Box>
  );
} 