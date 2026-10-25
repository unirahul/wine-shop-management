const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./database');
const { seedDatabase } = require('./seeder');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize DB and Seed if first run
initDatabase();
seedDatabase();

// API Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/products', require('./routes/products'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/banking', require('./routes/banking'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/accounting', require('./routes/accounting'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Grand Cru Wine Shop ERP & Multi-Branch Accounting',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build if available
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuild));

// Fallback for Single Page Application
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  const indexPath = path.join(clientBuild, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Wine Shop API Server is running on port ' + PORT + '. Frontend is running on Vite dev server.');
  }
});

app.listen(PORT, () => {
  console.log(`🍷 Grand Cru Wine Shop ERP Server listening on port ${PORT}`);
  console.log(`👉 API Health: http://localhost:${PORT}/api/health`);
  console.log(`👉 Web App URL: http://localhost:${PORT}`);
});
