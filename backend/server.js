require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import Separate Sub-Routers
const aiRouter = require('./routes/aiRoutes');
const sapRouter = require('./routes/sapRoutes');

const app = express();

// Global Middleware Configuration
app.use(cors());
app.use(express.json()); // Essential for parsing incoming JSON request bodies from React

// Global Error Catchment Boundaries
process.on('uncaughtException', err => {
  console.error("🔥 SYSTEM UNCAUGHT CRITICAL EXECUTE EXCEPTION:", err);
});

process.on('unhandledRejection', err => {
  console.error("🔥 SYSTEM UNHANDLED ASYNC REJECTION:", err);
});

// Base Core Health Assessment
app.get('/', (req, res) => {
  res.send("🚀 CPI LENS MONOLITH SPLIT COMPLETED - APP IS RUNNING HEALTHY");
});

// Mount Independent Execution Route Vectors
app.use('/ai', aiRouter);
app.use('/sap', sapRouter);

// Start Network Portal Server
// Frontend currently expects the backend on 40005 (can be overridden via PORT)
const PORT = process.env.PORT || 40005;
app.listen(PORT, () => {
  console.log(`🚀 CPI LENS RUNNING VECTOR ENGINE → http://localhost:${PORT}`);
});