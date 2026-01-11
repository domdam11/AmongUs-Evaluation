import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

function Home() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Benvenuto nel Dashboard
      </Typography>

      <Typography variant="body1" gutterBottom>
        Seleziona una voce dal menu laterale per accedere ai dati di sessione o alle informazioni sul progetto.
      </Typography>

      {/* Esempio placeholder per contenuti futuri */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6">Statistiche recenti</Typography>
            <Typography variant="body2">Qui potresti inserire grafici o dati riepilogativi.</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6">Ultime sessioni</Typography>
            <Typography variant="body2">Puoi mostrare qui un elenco delle ultime sessioni analizzate.</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Home;
