const { createProxyMiddleware } = require('http-proxy-middleware');
const { logger } = require('@devtinder/shared');

const createServiceProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        logger.debug(`Proxying request to ${target}${req.url}`);
      },
      error: (err, req, res) => {
        logger.error(`Proxy Error connecting to ${target}: ${err.message}`);
        // Handle case where res is actually a socket (for WebSockets upgrade)
        if (res && res.status) {
          res.status(502).json({ success: false, error: { message: 'Bad Gateway' } });
        }
      }
    }
  });
};

module.exports = {
  createServiceProxy
};
