import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class HivemindLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HivemindAPI');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params } = request;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip;
    
    const now = Date.now();
    const requestId = this.generateRequestId();
    
    // Add request ID to request for tracking
    (request as any).requestId = requestId;

    // Log incoming request
    this.logger.log(
      `[${requestId}] ${method} ${url} - ${ip} - ${userAgent}`,
      {
        requestId,
        method,
        url,
        ip,
        userAgent,
        body: this.sanitizeBody(body),
        query,
        params,
        timestamp: new Date().toISOString(),
      }
    );

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - now;
        this.logger.log(
          `[${requestId}] ${method} ${url} - ${response.statusCode} - ${responseTime}ms`,
          {
            requestId,
            method,
            url,
            statusCode: response.statusCode,
            responseTime,
            responseSize: JSON.stringify(data).length,
          }
        );
      }),
      catchError((error) => {
        const responseTime = Date.now() - now;
        this.logger.error(
          `[${requestId}] ${method} ${url} - ERROR - ${responseTime}ms`,
          {
            requestId,
            method,
            url,
            responseTime,
            error: {
              name: error.name,
              message: error.message,
              status: error.status || 500,
            },
          }
        );
        throw error;
      })
    );
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'privateKey', 'secret', 'token'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}