import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import ShippingServiceException from '../../../services/shipping/exeptions';

@Catch()
export default class GlobalExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    this.logger.error('Exception caught:', exception);

    // Handle custom ShippingServiceException
    if (exception instanceof ShippingServiceException) {
      const { message, status, errors } = exception;
      return response.status(status).json({
        statusCode: status,
        message,
        errors,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      return response.status(status).json({
        statusCode: status,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || 'An error occurred',
        error: typeof exceptionResponse === 'object' ? (exceptionResponse as any).error : undefined,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Handle database connection errors
    if ((exception as any)?.code === 'ECONNREFUSED' && (exception as any)?.port === 5342) {
      this.logger.error('Database connection refused - shutting down');
      process.exit(1);
    }

    // Handle generic errors (like your AuthUseCases error)
    if (exception instanceof Error) {
      const status = HttpStatus.INTERNAL_SERVER_ERROR;

      return response.status(status).json({
        statusCode: status,
        message: exception.message || 'Internal server error',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Fallback to base exception filter
    super.catch(exception, host);
  }
}
