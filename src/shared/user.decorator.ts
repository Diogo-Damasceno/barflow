import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  tenantId: string;
  roleId: string;
  email: string;
  permissions: string[];
}

/** @User() user: AuthUser — injeta o payload do JWT validado. */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
