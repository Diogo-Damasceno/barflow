import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../shared/prisma.service';
import { JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, tenantId: payload.tenantId, active: true },
      include: { role: { include: { permissions: true } } },
    });
    if (!user) return null;
    return {
      id: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
      email: user.email,
      permissions: user.role.permissions.map((p) => p.name),
    };
  }
}
