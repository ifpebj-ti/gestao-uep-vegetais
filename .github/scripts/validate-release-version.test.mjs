import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  isValidReleaseVersion,
  readReleaseArtifacts,
  validateReleaseArtifacts,
  validateReleaseVersion,
} from './validate-release-version.mjs';

function createFixture({ rootVersion = '0.1.4', frontendVersion = rootVersion, backendVersion = rootVersion } = {}) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'release-version-'));
  fs.mkdirSync(path.join(fixtureRoot, 'frontend'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, 'backend'), { recursive: true });

  fs.writeFileSync(path.join(fixtureRoot, 'VERSION'), `${rootVersion}\n`);
  fs.writeFileSync(
    path.join(fixtureRoot, 'frontend', 'package.json'),
    JSON.stringify({ name: 'frontend', version: frontendVersion }, null, 2)
  );
  fs.writeFileSync(
    path.join(fixtureRoot, 'backend', 'pom.xml'),
    `<project><artifactId>uep</artifactId><version>${backendVersion}</version></project>`
  );

  return fixtureRoot;
}

test('lê e valida os três artefatos do repositório', () => {
  const artifacts = readReleaseArtifacts(process.cwd());

  assert.deepEqual(artifacts, {
    VERSION: '0.1.4',
    frontendPackage: '0.1.4',
    backendPom: '0.1.4',
  });
  assert.deepEqual(validateReleaseVersion(process.cwd()), {
    valid: true,
    errors: [],
    version: '0.1.4',
  });
});

test('aceita versões semânticas estáveis e pré-1.0', () => {
  assert.equal(isValidReleaseVersion('0.1.0'), true);
  assert.equal(isValidReleaseVersion('0.1.10'), true);
  assert.equal(isValidReleaseVersion('1.20.300'), true);
});

test('rejeita versão vazia ou formato inválido', () => {
  const result = validateReleaseArtifacts({
    VERSION: '',
    frontendPackage: '0.1.x',
    backendPom: 'v0.1.4',
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 3);
  assert.match(result.errors[0], /VERSION contém uma versão inválida/);
  assert.match(result.errors[1], /frontend\/package\.json contém uma versão inválida/);
});

test('rejeita divergência no manifesto frontend', () => {
  const result = validateReleaseVersion(createFixture({ frontendVersion: '0.1.5' }));

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    'frontend/package.json diverge de VERSION: esperado 0.1.4, encontrado 0.1.5',
  ]);
});

test('rejeita divergência no pom do backend', () => {
  const result = validateReleaseVersion(createFixture({ backendVersion: '0.1.3' }));

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    'backend/pom.xml diverge de VERSION: esperado 0.1.4, encontrado 0.1.3',
  ]);
});
