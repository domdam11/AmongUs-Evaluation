require('dotenv').config();
const express = require('express');
const { createClient } = require('redis');
const cors = require('cors');

const app = express();
const port = process.env.API_PORT || 3002;

app.use(cors());

// Redis client
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

redisClient.on('error', (err) => console.error('Redis error:', err));

async function startServer() {
  await redisClient.connect();

  // GET /api/sensors — all sensor data
  app.get('/api/sensors', async (req, res) => {
  try {
    const keys = await redisClient.keys('event:*');
    const values = await Promise.all(
      keys.map(async (key) => {
        const raw = await redisClient.get(key);
        try {
          const parsed = JSON.parse(raw);
          return {
            sensorId: parsed.sensor_id || 'unknown',
            timestamp: parsed.timestamp,
            temperature: parsed.temperature ?? null,
            humidity: parsed.humidity ?? null
          };
        } catch (err) {
          console.warn('Invalid JSON for key', key);
          return null;
        }
      })
    );

    // Rimuove eventuali nulli
    const cleaned = values.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);

    res.json(cleaned);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



  app.listen(port, () => {
    console.log(`Sensor Redis API running at http://localhost:${port}`);
  });
}

startServer();
