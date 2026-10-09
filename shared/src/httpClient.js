const axios = require('axios');
const logger = require('./logger');

/**
 * Factory: creates a pre-configured Axios instance for calling a sibling service.
 *
 * @param {string} baseURL  - e.g. "http://profile-service:3002"
 * @param {object} [opts]   - Extra Axios defaults
 * @returns {import('axios').AxiosInstance}
 */
const createServiceClient = (baseURL, opts = {}) => {
  const client = axios.create({
    baseURL,
    timeout: parseInt(process.env.SERVICE_TIMEOUT, 10) || 5000,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Service': process.env.SERVICE_NAME || 'unknown',
    },
    ...opts,
  });

  // ---------- Request interceptor ----------
  client.interceptors.request.use(
    (config) => {
      logger.debug(`→ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      return config;
    },
    (err) => Promise.reject(err)
  );

  // ---------- Response interceptor ----------
  client.interceptors.response.use(
    (response) => response,
    (err) => {
      if (err.response) {
        logger.error(
          `← ${err.response.status} from ${err.config?.baseURL}${err.config?.url}: ${err.response.data?.message || err.message}`
        );
      } else {
        logger.error(`Service call failed: ${err.message}`);
      }
      return Promise.reject(err);
    }
  );

  return client;
};

module.exports = { createServiceClient };
