import { Line } from 'react-chartjs-2';
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
    'rgb(75, 192, 192)',   // Teal
    'rgb(255, 99, 132)',   // Pink
    'rgb(255, 205, 86)',   // Yellow
    'rgb(54, 162, 235)',   // Blue
    'rgb(153, 102, 255)',  // Purple
    'rgb(255, 159, 64)'    // Orange
  ];
  return colors[index % colors.length];
};

export default function CumulativeCostChart({ data }) {
  if (!data?.datasets) return null;

  const chartData = {
    labels: data.hours.map(hour => {
      const date = new Date(hour);
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }),
    datasets: data.datasets.map((dataset, index) => ({
      label: dataset.instanceName,
      data: dataset.data.map(d => d.cost),
      fill: false,
      borderColor: getInstanceColor(index),
      tension: 0.1
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
} 