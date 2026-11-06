import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables reliably whether run from server/ or project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Bootstrap and start the backend service
 * 
 * In accordance with architectural rule 6:
 * Server starts ONLY after database connection succeeds when MongoDB configuration is provided.
 */
const startServer = async () => {
  let serverInstance = null;

  try {
    // 1. Establish database connection if MongoDB configuration is supplied
    if (MONGODB_URI && MONGODB_URI.trim()) {
      console.log('🔄 Initializing database connection...');
      await connectDB(MONGODB_URI);
      console.log('✨ Database connection verified successfully.');
    } else {
      console.warn('⚠️  Notice: MONGODB_URI is not provided in environment variables.');
      console.warn('⚠️  Starting backend server foundation in standalone mode.');
    }

    // 2. Start Express HTTP server only after database connection succeeds
    serverInstance = app.listen(PORT, HOST, () => {
      console.log(`================================================`);
      console.log(`🚀 ProjectPulse AI Backend Service Started`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
      console.log(`⚙️  Environment: ${NODE_ENV}`);
      console.log(`🌐 Allowed Client: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(`================================================`);
    });

    // 3. Graceful termination handler
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 ${signal} received: Initiating graceful shutdown...`);

      if (serverInstance) {
        serverInstance.close(async () => {
          console.log('🔒 HTTP server closed');
          await disconnectDB();
          console.log('👋 Process exiting cleanly');
          process.exit(0);
        });
      } else {
        await disconnectDB();
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error(`\n❌ Server Startup Failure:`);
    console.error(`   ${error.message}`);
    console.error(`\n💡 Troubleshooting:`);
    console.error(`   - Verify that your local MongoDB daemon is running ('net start MongoDB').`);
    console.error(`   - Or update MONGODB_URI in server/.env with a valid MongoDB Atlas connection string.`);
    console.error(`   - To run in standalone mode without a database, leave MONGODB_URI empty in server/.env.\n`);
    process.exit(1);
  }
};

// Process-wide unhandled rejection & uncaught exception handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception thrown:', err);
  process.exit(1);
});

// Launch server
startServer();

export default app;
