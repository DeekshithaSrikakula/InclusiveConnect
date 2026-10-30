require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./services/dbService');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'InclusiveConnect - Multi-Organization Workplace Platform',
    mode: 'Multi-Tenant'
  });
});

app.use('/api', apiRoutes);

// Also serve frontend build so running backend alone works at http://localhost:5000
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

initDatabase().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 InclusiveConnect Full-Stack App running at http://localhost:${PORT}`);
    console.log(`🌐 Frontend Dev Server also available at http://localhost:5173`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`ℹ️  Port ${PORT} is already in use — InclusiveConnect Backend is already running at http://localhost:${PORT}!`);
      process.exit(0);
    } else {
      console.error('Server error:', err);
    }
  });
});
