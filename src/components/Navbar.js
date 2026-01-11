import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Among Us Dashboard
        </Typography>
        <Button color="inherit" component={RouterLink} to="/">Home</Button>
        <Button color="inherit" component={RouterLink} to="/session">Session</Button>
        <Button color="inherit" component={RouterLink} to="/about">About</Button>
      </Toolbar>
    </AppBar>
  );
}
