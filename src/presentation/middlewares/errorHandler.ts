import { Request, Response, NextFunction } from 'express';

/**
 * Error codes mapping based on design document
 * VAL001-VAL006: Validation errors (400)
 * BUS001-BUS004: Business errors (400 or 404)
 * INF001-INF003: Infrastructure errors (500)
 */

interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}

/**
 * Maps error types to HTTP status codes and error codes
 */
function getErrorMapping(error: Error): { status: number; code?: string; errorType: string } {
  const errorName = error.name;
  const message = error.message.toLowerCase();

  // Validation errors - 400 Bad Request
  if (errorName === 'ValidationError') {
    // Determine specific validation error code based on message
    let code = 'VAL001';
    
    if (message.includes('parte') || message.includes('part')) {
      code = 'VAL002';
    } else if (message.includes('configuração') || message.includes('configuration') || message.includes('positiv')) {
      code = 'VAL003';
    } else if (message.includes('peso') || message.includes('weight')) {
      code = 'VAL004';
    } else if (message.includes('tempo') || message.includes('time')) {
      code = 'VAL005';
    } else if (message.includes('margem') || message.includes('margin')) {
      code = 'VAL006';
    }

    return { status: 400, code, errorType: 'Validation Error' };
  }

  // Business errors - 400 Bad Request
  if (errorName === 'BusinessError') {
    let code = 'BUS001';
    
    if (message.includes('não disponível') || message.includes('not available') || message.includes('indisponível')) {
      code = 'BUS001';
    }

    return { status: 400, code, errorType: 'Business Error' };
  }

  // Not Found errors - 404 Not Found
  if (errorName === 'NotFoundError') {
    let code = 'BUS003';
    
    if (message.includes('produto') || message.includes('product')) {
      code = 'BUS003';
    } else if (message.includes('configuração') || message.includes('configuration')) {
      code = 'BUS004';
    }

    return { status: 404, code, errorType: 'Not Found' };
  }

  // Filament Not Found - 404 Not Found
  if (errorName === 'FilamentNotFoundError') {
    return { status: 404, code: 'BUS002', errorType: 'Not Found' };
  }

  // Infrastructure/Database errors - 500 Internal Server Error
  if (
    errorName === 'QueryFailedError' ||
    errorName === 'ConnectionError' ||
    message.includes('database') ||
    message.includes('connection')
  ) {
    let code = 'INF001';
    
    if (message.includes('persist') || message.includes('save') || message.includes('insert') || message.includes('update')) {
      code = 'INF002';
    } else if (message.includes('read') || message.includes('find') || message.includes('select')) {
      code = 'INF003';
    }

    return { status: 500, code, errorType: 'Internal Server Error' };
  }

  // Default - 500 Internal Server Error
  return { status: 500, errorType: 'Internal Server Error' };
}

/**
 * Centralized error handling middleware
 * Maps validation and business errors to appropriate HTTP responses
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Log errors in development mode
  if (isDevelopment) {
    console.error('[Error Handler]', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }

  const { status, code, errorType } = getErrorMapping(err);

  // Build error response
  const response: ErrorResponse = {
    error: errorType,
    message: isDevelopment || status < 500 ? err.message : 'An unexpected error occurred',
  };

  // Include error code if available
  if (code) {
    response.code = code;
  }

  res.status(status).json(response);
}

export default errorHandler;
