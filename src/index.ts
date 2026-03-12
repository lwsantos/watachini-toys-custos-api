import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './infrastructure/database/typeorm/data-source';

const PORT = process.env.PORT || 3000;

async function bootstrap(): Promise<void> {
  try {
    // Initialize TypeORM connection
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
