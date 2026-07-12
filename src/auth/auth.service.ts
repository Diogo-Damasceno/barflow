import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../shared/prisma.service';
import { CryptoService } from '../shared/crypto.service';
import { AuditService } from '../shared/audit.service';
import { LoginDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  roleId: string;
  email: string;
  permissions: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private jwt: JwtService,
    private config: ConfigService,
    private audit: AuditService,
  ) {}

  async validateUser(email: string, password: string, tenantId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, ...(tenantId ? { tenantId } : {}), active: true },
      include: { role: { include: { permissions: true } } },
    });
    if (!user) return null;
    // lockout por força bruta
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return null;
    }
    const ok = await this.crypto.verifyPassword(user.passwordHash, password);
    if (!ok) {
      const failed = user.failedLogins + 1;
      const lockedUntil = failed >= 5 ? new Date(Date.now() + 15 * 60_000) : null;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: failed, lockedUntil },
      });
      return null;
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    return user;
  }

  async login(dto: LoginDto, tenantId: string | undefined, ip?: string) {
    const user = await this.validateUser(dto.email, dto.password, tenantId);
    if (!user) throw new UnauthorizedException('credenciais inválidas');
    const permissions = user.role.permissions.map((p) => p.name);
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
      email: user.email,
      permissions,
    };
    const access = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TTL') || '15m',
    });
    const refresh = await this._issueRefresh(user.id, user.tenantId);
    await this.audit.log({ tenantId: user.tenantId, userId: user.id, action: 'AUTH_LOGIN', ip });
    return { accessToken: access, refreshToken: refresh };
  }

  private async _issueRefresh(userId: string, tenantId: string): Promise<string> {
    const raw = this.crypto.sha256(`${userId}:${Date.now()}:${Math.random()}`).slice(0, 32)
      + Math.random().toString(36).slice(2);
    const token = this.crypto.sha256(raw); // guardamos só o hash
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600_000);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: token, expiresAt },
    });
    return raw;
  }

  async refresh(raw: string) {
    const tokenHash = this.crypto.sha256(raw);
    const rec = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { user: { include: { role: { include: { permissions: true } } } } },
    });
    if (!rec || rec.expiresAt < new Date()) {
      throw new UnauthorizedException('refresh inválido');
    }
    const u = rec.user;
    const payload: JwtPayload = {
      sub: u.id, tenantId: u.tenantId, roleId: u.roleId, email: u.email,
      permissions: u.role.permissions.map((p) => p.name),
    };
    const access = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TTL') || '15m',
    });
    return { accessToken: access };
  }

  async logout(raw: string, tenantId: string) {
    const tokenHash = this.crypto.sha256(raw);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
