import React, { useEffect, useState } from 'react';
import {
  Container, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, FormControlLabel, Box, Typography, Stack, Snackbar, Alert,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../api/axiosInstance';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [openUserId, setOpenUserId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  // Add User dialog
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('user');

  // Dialog “User created/rotated”
  const [created, setCreated] = useState(null); // { id, role, sessionKey }

  // Rotate confirm dialog
  const [rotateTarget, setRotateTarget] = useState(null);
  const [rotating, setRotating] = useState(false);

  // Carica utenti e sessioni
  useEffect(() => {
    const load = async () => {
      try {
        const u = await api.get('/admin/users');
        const s = await api.get('/strategic/sessions');
        setUsers(Array.isArray(u.data) ? u.data : []);
        setSessions(Array.isArray(s.data) ? s.data : []);
      } catch (e) {
        setSnack({ open: true, msg: `Load failed: ${e.message || e}`, sev: 'error' });
      }
    };
    load();
  }, []);

  const openSessions = async (userId) => {
    setOpenUserId(userId);
    try {
      const res = await api.get(`/admin/users/${encodeURIComponent(userId)}/allowed-sessions`);
      const setIds = new Set(Array.isArray(res.data?.sessionIds) ? res.data.sessionIds : []);
      setSelected(setIds);
    } catch (e) {
      setSelected(new Set());
      setSnack({ open: true, msg: `Cannot load permissions: ${e.message || e}`, sev: 'warning' });
    }
  };

  const toggle = (sid) => {
    setSelected(prev => {
      const nx = new Set(prev);
      nx.has(sid) ? nx.delete(sid) : nx.add(sid);
      return nx;
    });
  };

  const save = async () => {
    if (!openUserId) return;
    setSaving(true);
    try {
      await api.put(`/admin/users/${encodeURIComponent(openUserId)}/allowed-sessions`, {
        sessionIds: Array.from(selected)
      });
      setSnack({ open: true, msg: 'Permissions saved', sev: 'success' });
      setOpenUserId(null);
    } catch (e) {
      setSnack({ open: true, msg: `Error: ${e.message || e}`, sev: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const createUser = async () => {
    if (!newUserId.trim()) {
      setSnack({ open: true, msg: 'userId is required', sev: 'warning' });
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/admin/users', {
        userId: newUserId.trim(),
        role: newRole
      });
      setUsers(prev => [...prev, { id: res.data.id, role: res.data.role }]);
      setOpenAdd(false);
      setNewUserId('');
      setNewRole('user');
      setCreated(res.data);
    } catch (e) {
      setSnack({ open: true, msg: `Create failed: ${e.message || e}`, sev: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const askRotate = (user) => {
    if (typeof user === 'string') {
      const found = users.find(u => u.id === user);
      setRotateTarget({ id: user, role: found?.role || 'user' });
    } else {
      setRotateTarget(user);
    }
  };

  const confirmRotate = async () => {
    if (!rotateTarget?.id) return;
    setRotating(true);
    try {
      const res = await api.post(`/admin/users/${encodeURIComponent(rotateTarget.id)}/rotate-session-key`);
      setCreated({
        id: res.data.userId,
        role: users.find(u => u.id === res.data.userId)?.role || rotateTarget.role || 'user',
        sessionKey: res.data.sessionKey
      });
      setSnack({ open: true, msg: 'Session key reset successfully', sev: 'success' });
      setRotateTarget(null);
    } catch (e) {
      setSnack({ open: true, msg: `Reset failed: ${e.message || e}`, sev: 'error' });
    } finally {
      setRotating(false);
    }
  };

  const copyKey = async () => {
    if (!created?.sessionKey) return;
    try {
      await navigator.clipboard.writeText(created.sessionKey);
      setSnack({ open: true, msg: 'Session key copied', sev: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Copy failed', sev: 'warning' });
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" color="primary">Users</Typography>
        <Button variant="contained" onClick={() => setOpenAdd(true)}>
          Add user
        </Button>
      </Box>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button size="small" variant="outlined" onClick={() => openSessions(u.id)}>
                      Sessions
                    </Button>
                    <Button size="small" variant="outlined" color="warning" onClick={() => askRotate(u)}>
                      Reset key
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">No users</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog: Add user */}
      <Dialog open={openAdd} onClose={() => !creating && setOpenAdd(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add user</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="User ID"
              value={newUserId}
              onChange={e => setNewUserId(e.target.value)}
              autoFocus
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                label="Role"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
              >
                <MenuItem value="user">user</MenuItem>
                <MenuItem value="admin">admin</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)} disabled={creating}>Cancel</Button>
          <Button onClick={createUser} disabled={creating} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Confirm rotate */}
      <Dialog open={!!rotateTarget} onClose={() => !rotating && setRotateTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset session key</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Reset session key for <b>{rotateTarget?.id}</b>?<br />
            The current key will stop working immediately.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRotateTarget(null)} disabled={rotating}>Cancel</Button>
          <Button onClick={confirmRotate} disabled={rotating} variant="contained" color="warning">
            Reset key
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: User created / key rotated (show sessionKey) */}
      <Dialog open={!!created} onClose={() => setCreated(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Session key</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Typography><b>Id:</b> {created?.id}</Typography>
            {created?.role && <Typography><b>Role:</b> {created.role}</Typography>}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography sx={{ wordBreak: 'break-all', flex: 1 }}>
                <b>Session key:</b> {created?.sessionKey}
              </Typography>
              <Tooltip title="Copy">
                <IconButton onClick={copyKey} size="small">
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Save this key now: it will only be shown once.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreated(null)} variant="contained">Done</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Manage sessions */}
      <Dialog open={!!openUserId} onClose={() => setOpenUserId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage sessions for {openUserId}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            {(Array.isArray(sessions) ? sessions : []).map(s => (
              <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                    />
                  }
                  label={<Typography>{s.id}</Typography>}
                />
              </Box>
            ))}
            {(!sessions || sessions.length === 0) && (
              <Typography color="text.secondary">No sessions found</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserId(null)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={2600}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.sev} sx={{ width: '100%' }}>{snack.msg}</Alert>
      </Snackbar>
    </Container>
  );
}
