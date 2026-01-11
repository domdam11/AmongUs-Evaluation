import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import Plot from 'react-plotly.js';

function SensorData() {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3002/api/sensors')
      .then(res => res.json())
      .then(data => {
        setSensorData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching sensor data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <CircularProgress color="secondary" />;
  }

  const timestamps = sensorData.map(d =>
    new Date(d.timestamp * 1000).toLocaleTimeString()
  );
  const temperatures = sensorData.map(d => d.temperature);
  const humidity = sensorData.map(d => d.humidity);
  const nodeLabels = sensorData.map(d => d.sensorId);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, color: '#f9d342' }}>
        Sensor Data Timeline
      </Typography>

      <Plot
        data={[
          {
            x: timestamps,
            y: temperatures,
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: 'orange' },
            name: 'Temperature (°C)',
            text: nodeLabels,
          },
        ]}
        layout={{
          paper_bgcolor: '#16213e',
          plot_bgcolor: '#16213e',
          font: { color: 'white' },
          xaxis: { title: 'Time' },
          yaxis: { title: 'Temperature (°C)' },
        }}
        style={{ width: '100%' }}
      />

      <Plot
        data={[
          {
            x: timestamps,
            y: humidity,
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: 'blue' },
            name: 'Humidity (%)',
            text: nodeLabels,
          },
        ]}
        layout={{
          paper_bgcolor: '#16213e',
          plot_bgcolor: '#16213e',
          font: { color: 'white' },
          xaxis: { title: 'Time' },
          yaxis: { title: 'Humidity (%)' },
        }}
        style={{ width: '100%', marginTop: '20px' }}
      />
    </Box>
  );
}

export default SensorData;
