import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HivemindException } from '../exceptions/hivemind.exceptions';

@Catch(HivemindException, HttpException)
export class HivemindExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HivemindExceptionFilter.name);

  catch(exception: HivemindException | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = exception.getStatus();
    const message = exception.message;
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    // Log the error with appropriate level
    const logMessage = `${method} ${path} - ${message}`;
    
    if (status >= 500) {
      this.logger.error(logMessage, exception.stack);
    } else if (status >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }

    // Build error response
    const errorResponse = {
      statusCode: status,
      timestamp,
      path,
      method,
      message,
      error: this.getErrorName(exception),
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception.stack,
        details: this.getErrorDetails(exception),
      }),
    };

    response.status(status).json(errorResponse);
  }

  private getErrorName(exception: HivemindException | HttpException): string {
    if (exception instanceof HivemindException) {
      return exception.constructor.name;
    }
    return 'HttpException';
  }

  private getErrorDetails(exception: HivemindException | HttpException): any {
    if (exception instanceof HivemindException) {
      return {
        type: 'HivemindException',
        name: exception.constructor.name,
      };
    }
    
    const response = exception.getResponse();
    return typeof response === 'object' ? response : { message: response };
  }
}