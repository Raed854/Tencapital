// config/database.js
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://mongo:aUCilWtBpGGwIcnNZYXQVKMQwyxYvgjA@mongodb.railway.internal:27017/investormatch?authSource=admin';

    if (!mongoURI) {
      throw new Error('❌ MONGODB_URI manquante. Vérifie les variables Railway.');
    }

    console.log('🔄 Tentative de connexion à MongoDB...');
    console.log('📍 URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Masquer les credentials

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    // Messages d'aide selon le type d'erreur
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Solution: Configurez MongoDB Atlas ou ajoutez un service MongoDB sur Railway');
      console.error('📖 Guide: Voir RAILWAY_SETUP.md');
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 Solution: Vérifiez le nom d\'utilisateur et mot de passe dans MONGODB_URI');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Solution: Vérifiez que l\'IP est autorisée dans MongoDB Atlas');
    }
    
    throw error;
  }
};

// Initialize database with default data
const initializeDatabase = async () => {
  try {
    await connectDB();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
  initializeDatabase,
};
