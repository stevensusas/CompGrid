import { Grid, Paper, Box, Typography } from '@mui/material';
import { Computer, Timer, AttachMoney } from '@mui/icons-material';

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

export default function StatsCards({ clusterStats, usageStats }) {
  const stats = [
    {
      icon: <Computer sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />,
      value: clusterStats ? `${clusterStats.assignment_percentage}%` : '0%',
      label: 'Cluster Assignment'
    },
    {
      icon: <Timer sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />,
      value: usageStats ? formatUsageTime(usageStats.total_hours) : '0h',
      label: 'Total Uptime'
    },
    {
      icon: <AttachMoney sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />,
      value: usageStats ? `$${usageStats.total_income}` : '$0',
      label: 'Total Income'
    }
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} md={4} key={index}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {stat.icon}
            <Typography variant="h4" gutterBottom>
              {stat.value}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {stat.label}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
} 