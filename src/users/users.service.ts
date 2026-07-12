import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CryptoService } from '../shared/crypto.service';
import { AuditService } from '../shared/audit.service';
import { CreateUserDto, UpdateUserRoleDto, CreateRoleDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateUserDto, tenantId: string, actorId: string) {
    const hash = await this.crypto.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        tenantId, roleId: dto.roleId, branchId: dto.branchId,
        name: dto.name, email: dto.email, passwordHash: hash,
      },
    });
    await this.audit.log({
      tenantId, userId: actorId, action: 'USER_CREATE',
      entity: 'User', entityId: user.id,
    });
    return this._safe(user);
  }

  async list(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      include: { role: true, branch: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this._safe(u));
  }

  async setRole(userId: string, dto: UpdateUserRoleDto, tenantId: string, actorId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('usuário não encontrado');
    // não permitir auto-rebaixar (evita lockout do último dono)
    if (user.id === actorId) throw new ForbiddenException('não altere seu próprio papel');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: dto.roleId },
    });
    await this.audit.log({
      tenantId, userId: actorId, action: 'PERMISSION_CHANGE',
      entity: 'User', entityId: userId, meta: { roleId: dto.roleId },
    });
    return this._safe(updated);
  }

  async remove(userId: string, tenantId: string) {
    await this.prisma.user.deleteMany({ where: { id: userId, tenantId } });
    return { ok: true };
  }

  // --- Papéis (RBAC extensível) ---
  async createRole(dto: CreateRoleDto, tenantId: string) {
    const perms = dto.permissions?.length
      ? await this.prisma.permission.findMany({ where: { name: { in: dto.permissions } } })
      : [];
    return this.prisma.role.create({
      data: {
        tenantId, name: dto.name, description: dto.description,
        permissions: { connect: perms.map((p) => ({ id: p.id })) },
      },
      include: { permissions: true },
    });
  }

  async listRoles(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      include: { permissions: true },
    });
  }

  private _safe(u: any) {
    const { passwordHash, ...rest } = u;
    return rest;
  }
}
