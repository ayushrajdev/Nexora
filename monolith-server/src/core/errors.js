export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, false);
  }
}

/**
 * ErrorFactory — Factory Pattern for creating typed domain errors.
 */
export class ErrorFactory {
  static badRequest(message) {
    return new BadRequestError(message);
  }

  static unauthorized(message) {
    return new UnauthorizedError(message);
  }

  static forbidden(message) {
    return new ForbiddenError(message);
  }

  static notFound(message) {
    return new NotFoundError(message);
  }

  static conflict(message) {
    return new ConflictError(message);
  }

  static internal(message) {
    return new InternalError(message);
  }
}
