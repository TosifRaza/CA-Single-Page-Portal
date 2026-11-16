import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[CA ProFlow] Server running on http://localhost:${PORT}`);
      console.log(`[CA ProFlow] API Root: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('[CA ProFlow] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
