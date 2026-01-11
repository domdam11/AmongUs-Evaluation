import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, CssBaseline, Box, useTheme, useMediaQuery, Button, Stack
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import StorageIcon from '@mui/icons-material/Storage';
import InfoIcon from '@mui/icons-material/Info';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import GroupIcon from '@mui/icons-material/Group';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import Session from './pages/Session';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import SensorData from './pages/SensorData';
import Login from './pages/Login';
import Users from './pages/Users';
import AdminPanel from './pages/AdminPanel';

import { AuthProvider, useAuth } from './auth/AuthContext';

const drawerWidth = 240;

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.role === 'admin'
    ? children
    : <Navigate to="/login" replace />;
}

function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const drawer = (
    <Box onClick={isMobile ? toggleDrawer : undefined} sx={{ width: drawerWidth }}>
      <List>
        <ListItemButton component={Link} to="/">
          <ListItemIcon><HomeIcon sx={{ color: '#ff4655' }} /></ListItemIcon>
          <ListItemText primary="Dashboard" sx={{ color: '#ffffff' }} />
        </ListItemButton>

        {isAuthenticated && (
          <ListItemButton component={Link} to="/session">
            <ListItemIcon><StorageIcon sx={{ color: '#00e5ff' }} /></ListItemIcon>
            <ListItemText primary="Session" sx={{ color: '#ffffff' }} />
          </ListItemButton>
        )}

        {isAuthenticated && (
          <ListItemButton component={Link} to="/sensor">
            <ListItemIcon><DeviceThermostatIcon sx={{ color: '#ffa726' }} /></ListItemIcon>
            <ListItemText primary="Sensor" sx={{ color: '#ffffff' }} />
          </ListItemButton>
        )}

        {isAuthenticated && user?.role === 'admin' && (
          <>
            <ListItemButton component={Link} to="/users">
              <ListItemIcon><GroupIcon sx={{ color: '#66bb6a' }} /></ListItemIcon>
              <ListItemText primary="Users" sx={{ color: '#ffffff' }} />
            </ListItemButton>
            <ListItemButton component={Link} to="/admin">
              <ListItemIcon><AdminPanelSettingsIcon sx={{ color: '#f06292' }} /></ListItemIcon>
              <ListItemText primary="Admin Panel" sx={{ color: '#ffffff' }} />
            </ListItemButton>
          </>
        )}

        <ListItemButton component={Link} to="/about">
          <ListItemIcon><InfoIcon sx={{ color: '#ffd740' }} /></ListItemIcon>
          <ListItemText primary="About" sx={{ color: '#ffffff' }} />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, backgroundColor: '#1a1a2e' }}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={toggleDrawer} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ color: '#ffffff', flexGrow: 1 }}>
            Among Us Strategic Dashboard
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            {isAuthenticated ? (
              <>
                <Typography variant="body2" sx={{ color: '#bbb' }}>
                  {user?.id} ({user?.role})
                </Typography>
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => { logout(); navigate('/login'); }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                size="small"
                color="inherit"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              mt: 8,
              backgroundColor: '#0f3460',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: '#0f3460',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          backgroundColor: '#16213e',
          minHeight: '100vh',
          color: '#ffffff',
          ...(isMobile ? {} : { ml: `${drawerWidth}px` })
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />

          {/* Protette */}
          <Route path="/session" element={<RequireAuth><Session /></RequireAuth>} />
          <Route path="/sensor" element={<RequireAuth><SensorData /></RequireAuth>} />
          <Route path="/users" element={<RequireAdmin><Users /></RequireAdmin>} />
          <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
        </Routes>
      </Box>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
