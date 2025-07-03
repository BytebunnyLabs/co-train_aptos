import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { AUDIT_LOG_KEY, AuditLogOptions } from '../decorators/audit-log.decorator';

interface AuditLogEntry {
  timestamp: string;
  requestId: string;
  action: string;
  resource: string;
  description?: string;
  user?: string;
  nodeId?: string;
  sessionId?: string;
  ip: string;
  userAgent: string;
  request?: any;
  response?: any;
  success: boolean;
  error?: string;
  duration: number;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');
  private auditLogs: AuditLogEntry[] = [];

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG_KEY,
      context.getHandler()
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();
    const requestId = (request as any).requestId || this.generateRequestId();

    const baseLogEntry: Partial<AuditLogEntry> = {
      timestamp: new Date().toISOString(),
      requestId,
      action: auditOptions.action,
      resource: auditOptions.resource,
      description: auditOptions.description,
      ip: request.ip,
      userAgent: request.get('User-Agent') || '',
      user: this.extractUser(request),
      nodeId: this.extractNodeId(request),
      sessionId: this.extractSessionId(request),
    };

    if (auditOptions.includeRequest) {
      baseLogEntry.request = this.sanitizeData(
        request.body || request.query || request.params,
        auditOptions.sensitiveFields
      );
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        
        const logEntry: AuditLogEntry = {
          ...baseLogEntry,
          success: true,
          duration,
        } as AuditLogEntry;

        if (auditOptions.includeResponse) {
          logEntry.response = this.sanitizeData(data, auditOptions.sensitiveFields);
        }

        this.logAuditEntry(logEntry);
        this.storeAuditLog(logEntry);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        const logEntry: AuditLogEntry = {
          ...baseLogEntry,
          success: false,
          error: error.message,
          duration,
        } as AuditLogEntry;

        this.logAuditEntry(logEntry);
        this.storeAuditLog(logEntry);
        
        throw error;
      })
    );
  }

  private extractUser(request: Request): string | undefined {
    return (request as any).user?.id || (request as any).user?.address;
  }

  private extractNodeId(request: Request): string | undefined {
    return request.query?.nodeId as string || 
           request.params?.nodeId as string ||
           request.body?.nodeId;
  }

  private extractSessionId(request: Request): string | undefined {
    return request.query?.sessionId as string || 
           request.params?.sessionId as string ||
           request.body?.sessionId;
  }

  private sanitizeData(data: any, sensitiveFields: string[] = []): any {
    if (!data) return data;

    const defaultSensitiveFields = [
      'password', 'privateKey', 'secret', 'token', 'publicKey'
    ];
    
    const fieldsToRedact = [...defaultSensitiveFields, ...sensitiveFields];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      fieldsToRedact.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '***REDACTED***';
        }
      });

      return sanitized;
    }

    return data;
  }

  private logAuditEntry(entry: AuditLogEntry): void {
    const logMessage = `[AUDIT] ${entry.action} ${entry.resource} - ${
      entry.success ? 'SUCCESS' : 'FAILED'
    } - ${entry.duration}ms`;

    if (entry.success) {
      this.logger.log(logMessage, {
        ...entry,
        level: 'audit',
      });
    } else {
      this.logger.error(`${logMessage} - ${entry.error}`, {
        ...entry,
        level: 'audit',
      });
    }
  }

  private storeAuditLog(entry: AuditLogEntry): void {
    // Store in memory (in production, this should go to a persistent store)
    this.auditLogs.push(entry);
    
    // Keep only last 1000 entries
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Public method to get audit logs (for admin endpoints)
  getAuditLogs(filters?: {
    action?: string;
    resource?: string;
    nodeId?: string;
    sessionId?: string;
    success?: boolean;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): AuditLogEntry[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      
      if (filters.resource) {
        logs = logs.filter(log => log.resource === filters.resource);
      }
      
      if (filters.nodeId) {
        logs = logs.filter(log => log.nodeId === filters.nodeId);
      }
      
      if (filters.sessionId) {
        logs = logs.filter(log => log.sessionId === filters.sessionId);
      }
      
      if (filters.success !== undefined) {
        logs = logs.filter(log => log.success === filters.success);
      }
      
      if (filters.fromDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= filters.fromDate!);
      }
      
      if (filters.toDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= filters.toDate!);
      }

      if (filters.limit) {
        logs = logs.slice(-filters.limit);
      }
    }

    return logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Get audit statistics
  getAuditStats(): {
    totalLogs: number;
    successRate: number;
    topActions: Array<{ action: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
    avgDuration: number;
  } {
    const totalLogs = this.auditLogs.length;
    const successCount = this.auditLogs.filter(log => log.success).length;
    const successRate = totalLogs > 0 ? (successCount / totalLogs) * 100 : 0;

    // Count actions
    const actionCounts = new Map<string, number>();
    const resourceCounts = new Map<string, number>();
    let totalDuration = 0;

    this.auditLogs.forEach(log => {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
      resourceCounts.set(log.resource, (resourceCounts.get(log.resource) || 0) + 1);
      totalDuration += log.duration;
    });

    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topResources = Array.from(resourceCounts.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const avgDuration = totalLogs > 0 ? totalDuration / totalLogs : 0;

    return {
      totalLogs,
      successRate: Math.round(successRate * 100) / 100,
      topActions,
      topResources,
      avgDuration: Math.round(avgDuration * 100) / 100,
    };
  }
}