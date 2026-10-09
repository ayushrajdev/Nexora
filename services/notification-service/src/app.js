require('dotenv').config();
const express = require('express');
const { errorHandler } = require('@devtinder/shared');
require('./consumers/userEventConsumer');
require('./consumers/connectionEventConsumer');
require('./consumers/paymentEventConsumer');
require('./cron/dailyDigest');

const app = express();
app.use(express.json());

// basic health check
app.get('/health', (req, res) => res.send('OK'));

app.use(errorHandler);

const startServer = () => {
  const port = process.env.PORT || 3006;
  app.listen(port, () => {
    console.log(`Notification Service listening on port ${port}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };