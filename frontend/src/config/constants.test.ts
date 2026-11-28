import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import frontendPackage from '../../package.json';
import { describe, expect, it } from 'vitest';
import { APP_CONFIG } from './constants';

describe('APP_CONFIG version', () => {
  it('matches the versions managed by Release Please', () => {
    const repositoryVersion = readFileSync(
      resolve(process.cwd(), '../VERSION'),
      'utf8',
    ).trim();

    expect(APP_CONFIG.version).toBe(frontendPackage.version);
    expect(APP_CONFIG.version).toBe(repositoryVersion);
    expect(APP_CONFIG.version).not.toBe('1.0.0');
    expect(APP_CONFIG.version).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/);
  });
});
