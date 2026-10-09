const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { errorHandler, logger } = require('@devtinder/shared');
const connectDB = require('./config/database');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const oauthRoutes = require('./routes/oauthRoutes');
const { consumePaymentEvents } = require('./events/consumer');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONT_END_URL || 'http://localhost:3000', credentials: true }));

app.use('/', authRoutes);
app.use('/oauth', oauthRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB');
    
    // Start background consumers
    consumePaymentEvents().catch(err => logger.error('Error starting payment event consumer', { error: err.message }));

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

module.exports = { app, startServer };

if (require.main === module) {
  startServer();
}
