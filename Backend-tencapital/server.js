const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database configuration
const { initializeDatabase } = require('./config/database');

// Import routes
const routes = require('./routes');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const jsonErrorHandler = require('./middleware/jsonErrorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Middleware pour gérer les erreurs de parsing JSON
app.use(jsonErrorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database tables
    await initializeDatabase();
    
    // Routes
    app.use('/', routes);
    
    // Error handling middleware
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
