/**
 * Base error class for application-specific errors.
 * Provides consistent error structure with code and status.
 */
export class BaseError extends Error {
  code: string;
  statusCode?: number;
  override cause?: Error;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.cause = cause;
  }
}

/**
 * Error thrown when an API request fails.
 */
export class ApiError extends BaseError {
  constructor(message: string, statusCode?: number, cause?: Error) {
    super(message, 'API_ERROR', statusCode, cause);
  }
}

/**
 * Error thrown when a requested resource is not found.
 */
export class NotFoundError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(message, 'NOT_FOUND', 404, cause);
  }
}

/**
 * Error thrown when there's a network connectivity issue.
 */
export class NetworkError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', undefined, cause);
  }
}

