// src/pages/Dashboard.js
import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

function Dashboard() {
  return (
    <Box
      sx={{
        backgroundColor: '#0f3460',
        color: 'white',
        p: 3,
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ color: '#f9d342' }}>
        Strategic Dashboard
      </Typography>

      <Typography variant="body1" gutterBottom>
        Use the menu to access session data or system information.
      </Typography>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, backgroundColor: '#16213e', color: 'white' }}>
            <Typography variant="h6" sx={{ color: '#f94c66' }}>Recent Statistics</Typography>
            <Typography variant="body2">
              Add charts or summary data here.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, backgroundColor: '#16213e', color: 'white' }}>
            <Typography variant="h6" sx={{ color: '#f94c66' }}>Latest Sessions</Typography>
            <Typography variant="body2">
              Display a list of recently analyzed sessions.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
