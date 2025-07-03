import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'auditLog';

export interface AuditLogOptions {
  action: string;
  resource: string;
  description?: string;
  includeRequest?: boolean;
  includeResponse?: boolean;
  sensitiveFields?: string[];
}

export const AuditLog = (options: AuditLogOptions) => 
  SetMetadata(AUDIT_LOG_KEY, options);