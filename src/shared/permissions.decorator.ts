import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'barflow:permissions';

/** @Require('product:create', 'sale:cancel') */
export const Require = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
