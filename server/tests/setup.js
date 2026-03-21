/**
 * Test Setup File
 * Chạy trước tất cả tests để setup môi trường test
 */

import { beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

let mongoServer;

// Setup trước khi chạy tất cả tests
beforeAll(async () => {
  try {
    // Tạo MongoDB in-memory server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Disconnect nếu đã connect
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connect to in-memory database
    await mongoose.connect(mongoUri);
    
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection error:', error);
    throw error;
  }
}, 60000); // Tăng timeout lên 60s cho MongoDB Memory Server

// Cleanup sau mỗi test
afterEach(async () => {
  try {
    // Clear all collections sau mỗi test để đảm bảo isolation
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('❌ Error clearing collections:', error);
  }
});

// Cleanup sau khi chạy xong tất cả tests
afterAll(async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting test database:', error);
  }
});
