import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../shared/guards';
import { User, AuthUser } from '../shared/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: any) {
    const tenantId = this._tenantFromHost(req);
    return this.auth.login(dto, tenantId, req.ip);
  }

  @Post('refresh')
  refresh(@Req() req: any) {
    const raw = this._bearer(req) ?? req.body?.refreshToken;
    return this.auth.refresh(raw);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@User() u: AuthUser, @Req() req: any) {
    const raw = this._bearer(req);
    if (!raw) return { ok: false, message: 'refresh token ausente' };
    return this.auth.logout(raw, u.tenantId);
  }

  // tenant vindo de header (preparado p/ SaaS); em single-tenant/dev ausente -> undefined
  private _tenantFromHost(req: any): string | undefined {
    const h = req.headers['x-tenant-id'];
    return typeof h === 'string' && h.length ? h : undefined;
  }
  private _bearer(req: any): string | undefined {
    const h = req.headers['authorization'];
    return h?.startsWith('Bearer ') ? h.slice(7) : undefined;
  }
}
