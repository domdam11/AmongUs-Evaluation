import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Paper, TextField, Typography, Alert } from '@mui/material';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [sessionKey, setSessionKey] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(userId.trim(), sessionKey.trim());
      navigate('/'); // vai in Dashboard
    } catch (err) {
      setError(err.message || 'Errore di login');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper sx={{ p: 3, bgcolor: '#1e2a47' }}>
        <Typography variant="h6" sx={{ color: '#f9d342', mb: 2 }}>
          Sign in
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={onSubmit}>
          <TextField
            fullWidth
            label="User ID"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            margin="normal"
            InputLabelProps={{ style: { color: '#bbb' } }}
            InputProps={{ style: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="Session Key"
            value={sessionKey}
            onChange={e => setSessionKey(e.target.value)}
            type="password"
            margin="normal"
            InputLabelProps={{ style: { color: '#bbb' } }}
            InputProps={{ style: { color: '#fff' } }}
          />
          <Button fullWidth type="submit" variant="contained" sx={{ mt: 2, bgcolor: '#00bcd4' }}>
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
