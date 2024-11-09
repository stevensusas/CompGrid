import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const formatUptime = (hours) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)} mins`;
  } else if (hours < 24) {
    return `${hours.toFixed(1)} hrs`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round((hours % 24) * 10) / 10;
    return remainingHours > 0 ? 
      `${days}d ${remainingHours}h` : 
      `${days}d`;
  }
};

export default function UptimeChart({ data }) {
  if (!data?.instances) {
    return <div>Loading...</div>;
  }

  const chartData = {
    labels: data.instances.map(instance => instance.name),
    datasets: [{
      label: 'Total Uptime',
      data: data.instances.map(instance => instance.hours),
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
      barPercentage: 0.7,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false  // Hide legend since we only have one dataset
      },
      title: {
        display: true,
        text: 'Total Uptime per Instance',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Uptime: ${formatUptime(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
          font: {
            size: 14
          }
        },
        ticks: {
          callback: (value) => formatUptime(value)
        }
      },
      x: {
        title: {
          display: true,
          text: 'Instances',
          font: {
            size: 14
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
} 