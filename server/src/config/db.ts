import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

let mongoMemoryServerInstance: any = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ca_proflow';

  try {
    // Attempt standard connection first with a 2-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[MongoDB] Connected successfully to external instance: ${uri}`);
  } catch (err: any) {
    console.log(`[MongoDB] External connection to ${uri} failed (${err.message}). Launching embedded persistent MongoDB...`);
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const dbPath = path.join(process.cwd(), 'db_data');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      mongoMemoryServerInstance = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbPath: dbPath,
          storageEngine: 'wiredTiger',
          dbName: 'ca_proflow',
        },
      });

      const baseUri = mongoMemoryServerInstance.getUri();
      const memoryUri = baseUri.endsWith('/') ? `${baseUri}ca_proflow` : `${baseUri}/ca_proflow`;
      await mongoose.connect(memoryUri, { dbName: 'ca_proflow' });
      console.log(`[MongoDB] Embedded MongoDB running at: ${memoryUri} with persistence at ${dbPath}`);
    } catch (embeddedErr: any) {
      console.error('[MongoDB] Fatal error initializing database:', embeddedErr);
      throw embeddedErr;
    }
  }
};

export const closeDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
  }
};
