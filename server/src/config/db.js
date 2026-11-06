import dns from 'dns';
try {
  // Ensure reliable DNS SRV resolution on Windows for MongoDB Atlas URIs
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Fall back to system DNS
}

import mongoose from 'mongoose';

/**
 * Connect to MongoDB database via Mongoose
 * 
 * @param {string} uri - MongoDB connection string (URI)
 * @returns {Promise<typeof mongoose>} Mongoose instance on successful connection
 */
export const connectDB = async (uri, options = {}) => {
  if (!uri) {
    throw new Error('MONGODB_URI is not defined. Please configure it in server/.env.');
  }

  try {
    // Set up connection event listeners for runtime monitoring
    if (mongoose.connection.listenerCount('connected') === 0) {
      mongoose.connection.on('connected', () => {
        console.log('📡 Mongoose connection established');
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ Mongoose connection disconnected');
      });
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging 30s
      dbName: process.env.MONGODB_DB_NAME || 'projectpulse-ai',
      ...options,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ Database connection failed: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnect from MongoDB gracefully
 * 
 * Useful during process termination or automated test teardown
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 MongoDB connection closed gracefully');
    }
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error.message);
  }
};

export default connectDB;
