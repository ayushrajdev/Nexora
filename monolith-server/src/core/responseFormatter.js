/**
 * ResponseFactory — Factory Pattern for consistent API JSON responses.
 */
export class ResponseFactory {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    return res.status(statusCode).json(response);
  }

  static created(res, data = null, message = 'Created successfully') {
    return ResponseFactory.success(res, data, message, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

export const sendSuccess = ResponseFactory.success;
export const sendCreated = ResponseFactory.created;
export const sendNoContent = ResponseFactory.noContent;
