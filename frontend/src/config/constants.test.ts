import packageJson from '../../package.json';
import { describe, expect, it } from 'vitest';
import { APP_CONFIG } from './constants';

describe('APP_CONFIG.version', () => {
  it('usa a versão sincronizada do manifesto do frontend', () => {
    expect(APP_CONFIG.version).toBe(packageJson.version);
  });

  it('mantém o formato semântico usado pelo release', () => {
    expect(APP_CONFIG.version).toMatch(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  });

  it('não mantém uma versão independente na configuração da aplicação', () => {
    expect(APP_CONFIG.version).not.toBe('1.0.0');
    expect(APP_CONFIG.version).toBe(packageJson.version);
  });
});
