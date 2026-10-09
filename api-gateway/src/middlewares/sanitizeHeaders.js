const sanitizeHeaders = (req, res, next) => {
  // Strip any incoming X-User-* headers to prevent spoofing
  for (const header in req.headers) {
    if (header.toLowerCase().startsWith('x-user-')) {
      delete req.headers[header];
    }
  }
  next();
};

module.exports = sanitizeHeaders;
