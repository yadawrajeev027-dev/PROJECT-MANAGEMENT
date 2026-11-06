import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';

/**
 * Diagnostic utility to test MongoDB connectivity
 * 
 * Usage:
 *   node src/utils/testDbConnection.js
 */
const runDbTest = async () => {
  const uri = process.env.MONGODB_URI;

  console.log('================================================');
  console.log('🧪 ProjectPulse AI - Database Connection Test');
  console.log(`📡 Target URI: ${uri ? uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : '(None)'}`);
  console.log('================================================');

  if (!uri || !uri.trim()) {
    console.error('❌ MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  try {
    const conn = await connectDB(uri);
    console.log(`\n🎉 Connection successful!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Port: ${conn.connection.port}`);
    console.log(`   Database Name: ${conn.connection.name}`);
    console.log(`   Ready State: ${conn.connection.readyState} (1 = connected)`);
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Database connection test failed:`);
    console.error(`   Message: ${err.message}`);
    process.exit(1);
  }
};

runDbTest();
