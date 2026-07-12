import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(input: {
    tenantId: string;
    userId?: string;
    action: string;
    entity?: string;
    entityId?: string;
    ip?: string;
    meta?: Record<string, unknown>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        ip: input.ip,
        meta: (input.meta ?? {}) as object,
      },
    });
  }
}
