import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

function About() {
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: '#16213e',
        color: 'white',
        p: 3,
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ color: '#f9d342' }}>
        About This Project
      </Typography>

      <Box component="p" sx={{ mt: 2 }}>
        This dashboard has been designed to visualize and export strategic gameplay data
        collected during experimental sessions on the <strong>Among Us</strong> testbed.
      </Box>

      <Box component="p" sx={{ mt: 2 }}>
        It provides support for viewing detailed session data, exporting reports to CSV, and
        integrating advanced features such as strategy recognition, player behavior tracking,
        and real-time updates.
      </Box>
    </Paper>
  );
}

export default About;
