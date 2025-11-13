import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import ShippingServiceException from '../../../services/shipping/exeptions';

@Catch()
export default class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger();

  catch(exception: unknown, host: ArgumentsHost) {
    console.log(exception, 'exception');
    if (exception instanceof ShippingServiceException) {
      const { message, status, errors } = exception;

      return host.switchToHttp().getResponse().status(status).json({
        statusCode: status,
        message,
        errors,
      });
    }

    if ((exception as any).code === 'ECONNREFUSED' && (exception as any).port === parseInt('5342')) {
      this.logger.error('Database connection refused');

      process.exit(1);
    }

    super.catch(exception, host);
  }
}
