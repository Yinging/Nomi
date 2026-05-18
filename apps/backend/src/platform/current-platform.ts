import { type Platform, resolvePlatform } from './platform.js';

let _platform: Platform | null = null;

/**
 * Returns the active Platform instance.
 * Resolved once at startup; cached for the process lifetime.
 */
export function getPlatform(): Platform {
  if (!_platform) {
    _platform = resolvePlatform();
  }
  return _platform;
}

/** For testing only — reset the cached instance. */
export function resetPlatformForTesting(): void {
  _platform = null;
}
