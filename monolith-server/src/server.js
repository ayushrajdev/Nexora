import http from 'http';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import { connectDatabase } from './config/database.js';
import logger from './core/logger.js';
import { app } from './app.js';
import { setupSocket } from './modules/chat/index.js';

export const startServer = async (port = env.PORT, connectDb = true) => {
  if (connectDb) {
    await connectDatabase();
  }

  const server = http.createServer(app);
  const io = setupSocket(server);

  await new Promise((resolve) => {
    server.listen(port, () => {
      logger.info(
        `DevTinder Modular Monolith Server listening on port ${port}`
      );
      resolve();
    });
  });

  return { server, io };
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer().catch((err) => {
    logger.error('Failed to start monolith server:', err);
    process.exit(1);
  });
}
