import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PERMISSIONS_KEY } from './permissions.decorator';

/**
 * Guard de autenticação (JWT no header Authorization: Bearer).
 * Sobrescreve o AuthGuard do passport para lançar 401 claro.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, _info: any, _ctx: ExecutionContext) {
    if (err || !user) throw err || new (require('@nestjs/common').UnauthorizedException)();
    return user;
  }
}

/** Guard de autorização RBAC baseado no decorator @Require(...). */
@Injectable()
export class PermissionsGuard {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const user = ctx.switchToHttp().getRequest().user;
    if (!user?.permissions) return false;
    return required.every((p) => user.permissions.includes(p));
  }
}
