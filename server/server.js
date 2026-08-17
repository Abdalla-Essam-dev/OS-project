const express = require('express');
const cors = require('cors');
const path = require('path');
const boundedBufferSim = require('./engines/boundedBuffer');
const readersWritersSim = require('./engines/readersWriters');
const diningPhilosophersSim = require('./engines/diningPhilosophers');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10mb' }));

// Request logging for debugging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

function validateInt(val, name, min) {
  if (val === undefined || val === null || val === '') return `${name} is required`;
  if (typeof val !== 'number' || !Number.isInteger(val)) return `${name} must be an integer`;
  if (val < min) return `${name} must be >= ${min}`;
  return null;
}

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ─── Simulation endpoint ─────────────────────────────────────────────────────
app.post('/api/simulate', (req, res) => {
  const { problem, config } = req.body;

  if (!problem || !['bounded-buffer', 'readers-writers', 'dining-philosophers'].includes(problem)) {
    return res.status(400).json({ error: 'Invalid problem type' });
  }

  if (!config || typeof config !== 'object') {
    return res.status(400).json({ error: 'Config is required' });
  }

  let result;

  try {
    if (problem === 'bounded-buffer') {
      const errors = [
        validateInt(config.bufferSize, 'Buffer Size', 1),
        validateInt(config.numProducers, 'Number of Producers', 1),
        validateInt(config.numConsumers, 'Number of Consumers', 1),
      ].filter(Boolean);
      if (errors.length) return res.status(400).json({ error: errors[0] });
      if (config.bufferSize > 12) {
        return res.status(400).json({ error: 'Max buffer size is 12 for visualization' });
      }
      result = boundedBufferSim({
        bufferSize: config.bufferSize,
        numProducers: Math.min(config.numProducers, 5),
        numConsumers: Math.min(config.numConsumers, 5),
        delay: config.delay || 0,
      });
    }

    if (problem === 'readers-writers') {
      const errors = [
        validateInt(config.numReaders, 'Number of Readers', 1),
        validateInt(config.numWriters, 'Number of Writers', 1),
        validateInt(config.readTime, 'Read Time', 1),
        validateInt(config.writeTime, 'Write Time', 1),
      ].filter(Boolean);
      if (errors.length) return res.status(400).json({ error: errors[0] });
      if (!['reader-preference', 'writer-preference'].includes(config.priorityMode)) {
        return res.status(400).json({ error: 'Invalid priority mode' });
      }
      result = readersWritersSim({
        numReaders: Math.min(config.numReaders, 8),
        numWriters: Math.min(config.numWriters, 5),
        readTime: config.readTime,
        writeTime: config.writeTime,
        priorityMode: config.priorityMode,
      });
    }

    if (problem === 'dining-philosophers') {
      const errors = [
        validateInt(config.numPhilosophers, 'Number of Philosophers', 3),
        validateInt(config.eatDuration, 'Eating Duration', 1),
        validateInt(config.thinkDuration, 'Thinking Duration', 1),
      ].filter(Boolean);
      if (errors.length) return res.status(400).json({ error: errors[0] });
      if (config.numPhilosophers > 10) {
        return res.status(400).json({ error: 'Max 10 philosophers for performance' });
      }
      if (!['asymmetric', 'limit_seats', 'both_at_once'].includes(config.strategy)) {
        return res.status(400).json({ error: 'Invalid deadlock strategy' });
      }
      result = diningPhilosophersSim({
        numPhilosophers: config.numPhilosophers,
        eatDuration: config.eatDuration,
        thinkDuration: config.thinkDuration,
        strategy: config.strategy,
      });
    }

    console.log(`  -> Generated ${result.frames.length} frames for ${problem}`);
    res.json({
      totalFrames: result.frames.length,
      frames: result.frames,
    });
  } catch (err) {
    console.error('  -> Simulation error:', err.message);
    res.status(500).json({ error: `Simulation engine error: ${err.message}` });
  }
});

// ─── Catch-all: return JSON 404 instead of HTML ──────────────────────────────
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n  Sync Simulator API running on http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health\n`);
});
