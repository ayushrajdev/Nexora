/**
 * Standard response formatter for all microservices.
 * Ensures a consistent JSON response shape across the API.
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

const sendCreated = (res, data = null, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

const sendNoContent = (res) => {
  return res.status(204).send();
};

module.exports = { sendSuccess, sendCreated, sendNoContent };
