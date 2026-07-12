import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CryptoService } from './crypto.service';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [PrismaService, CryptoService, AuditService],
  exports: [PrismaService, CryptoService, AuditService],
})
export class SharedModule {}
