import { SESClient } from '@aws-sdk/client-ses';

export const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || 'dummy_key',
    secretAccessKey: process.env.AWS_SECRET_KEY || 'dummy_secret',
  },
});

export default sesClient;
