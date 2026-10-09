const cron = require('node-cron');

cron.schedule('0 8 * * *', () => {
  console.log('Daily digest triggered at 8 AM');
  // Simple implementation: Just logging for now
  // Real-time events handle emails via consumers
});