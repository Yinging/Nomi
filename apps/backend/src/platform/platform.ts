/**
 * Platform abstraction — injected at startup, replaces scattered env-var if-branches.
 *
 * Two implementations:
 *   ServerPlatform  — PostgreSQL + S3/RustFS + multi-user JWT auth
 *   DesktopPlatform — SQLite/libsql + local filesystem + single-user bypass
 */
export type PlatformMode = 'server' | 'desktop';

export interface Platform {
  readonly mode: PlatformMode;

  /** True when running as the Electron desktop app (SQLite, local assets, single-user). */
  readonly isDesktop: boolean;

  /** True when running as a networked server (PostgreSQL, S3, multi-user JWT). */
  readonly isServer: boolean;

  /**
   * Storage backend for generated assets.
   * 'local' = write to filesystem under ASSET_LOCAL_ROOT
   * 's3'    = upload to S3/RustFS
   */
  readonly assetStorage: 'local' | 's3';

  /**
   * Database provider key, passed to @prisma/adapter-libsql vs native PG.
   * 'libsql'     = SQLite via @prisma/adapter-libsql (desktop)
   * 'postgresql' = native PostgreSQL driver (server)
   */
  readonly dbProvider: 'libsql' | 'postgresql';

  /**
   * Identity model.
   * 'single-user' = bypass all auth, inject a fixed admin user (desktop)
   * 'multi-user'  = full JWT / GitHub OAuth / email flows (server)
   */
  readonly identityMode: 'single-user' | 'multi-user';
}

// ---------------------------------------------------------------------------
// Concrete implementations
// ---------------------------------------------------------------------------

export class ServerPlatform implements Platform {
  readonly mode = 'server' as const;
  readonly isDesktop = false;
  readonly isServer = true;
  readonly assetStorage = 's3' as const;
  readonly dbProvider = 'postgresql' as const;
  readonly identityMode = 'multi-user' as const;
}

export class DesktopPlatform implements Platform {
  readonly mode = 'desktop' as const;
  readonly isDesktop = true;
  readonly isServer = false;
  readonly assetStorage = 'local' as const;
  readonly dbProvider = 'libsql' as const;
  readonly identityMode = 'single-user' as const;
}

// ---------------------------------------------------------------------------
// Factory — read env vars once at startup
// ---------------------------------------------------------------------------

/**
 * Resolve the active platform from environment variables.
 *
 * Desktop mode is active when ANY of these are set:
 *   NOMI_SINGLE_USER_MODE=1 | true
 *   PRISMA_DB_PROVIDER=libsql
 *   ASSET_HOSTING_LOCAL_MODE=1 | true
 */
export function resolvePlatform(): Platform {
  const singleUser = String(process.env.NOMI_SINGLE_USER_MODE ?? process.env.TAPCANVAS_DEV_PUBLIC_BYPASS ?? '').trim();
  const dbProvider = String(process.env.PRISMA_DB_PROVIDER ?? '').trim().toLowerCase();
  const localAssets = String(process.env.ASSET_HOSTING_LOCAL_MODE ?? '').trim();

  const isDesktop =
    singleUser === '1' || singleUser === 'true' ||
    dbProvider === 'libsql' ||
    localAssets === '1' || localAssets === 'true';

  return isDesktop ? new DesktopPlatform() : new ServerPlatform();
}
