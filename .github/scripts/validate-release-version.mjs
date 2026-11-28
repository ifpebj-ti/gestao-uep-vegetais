import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function readText(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo obrigatório ausente: ${label}`);
  }

  const value = fs.readFileSync(filePath, 'utf8').trim();
  if (!value) {
    throw new Error(`Arquivo obrigatório vazio: ${label}`);
  }

  return value;
}

function readFrontendVersion(packagePath) {
  const packageContents = readText(packagePath, 'frontend/package.json');
  let packageJson;

  try {
    packageJson = JSON.parse(packageContents);
  } catch (error) {
    throw new Error(`frontend/package.json inválido: ${error.message}`);
  }

  if (typeof packageJson.version !== 'string' || !packageJson.version.trim()) {
    throw new Error('frontend/package.json não possui um campo version válido');
  }

  return packageJson.version.trim();
}

function readBackendVersion(pomPath) {
  const pomContents = readText(pomPath, 'backend/pom.xml');
  const projectVersion = pomContents.match(
    /<artifactId>\s*uep\s*<\/artifactId>\s*<version>\s*([^<\s]+)\s*<\/version>/m
  );

  if (!projectVersion) {
    throw new Error('backend/pom.xml não possui a versão do artefato uep');
  }

  return projectVersion[1].trim();
}

export function isValidReleaseVersion(value) {
  return typeof value === 'string' && SEMVER_PATTERN.test(value.trim());
}

export function readReleaseArtifacts(repoRoot) {
  const root = path.resolve(repoRoot);

  return {
    VERSION: readText(path.join(root, 'VERSION'), 'VERSION'),
    frontendPackage: readFrontendVersion(path.join(root, 'frontend', 'package.json')),
    backendPom: readBackendVersion(path.join(root, 'backend', 'pom.xml')),
  };
}

export function validateReleaseArtifacts(artifacts) {
  const errors = [];
  const entries = [
    ['VERSION', artifacts.VERSION],
    ['frontend/package.json', artifacts.frontendPackage],
    ['backend/pom.xml', artifacts.backendPom],
  ];

  for (const [label, value] of entries) {
    if (!isValidReleaseVersion(value)) {
      errors.push(`${label} contém uma versão inválida: ${value || '<vazia>'}`);
    }
  }

  const canonicalVersion = artifacts.VERSION?.trim();
  if (canonicalVersion) {
    for (const [label, value] of entries.slice(1)) {
      if (value?.trim() !== canonicalVersion) {
        errors.push(
          `${label} diverge de VERSION: esperado ${canonicalVersion}, encontrado ${value || '<vazio>'}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    version: canonicalVersion,
  };
}

export function validateReleaseVersion(repoRoot = process.cwd()) {
  return validateReleaseArtifacts(readReleaseArtifacts(repoRoot));
}

function runCli() {
  try {
    const result = validateReleaseVersion(process.cwd());

    if (!result.valid) {
      console.error('Release version validation failed:');
      for (const error of result.errors) {
        console.error(`- ${error}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log(`Release version validation passed: ${result.version}`);
  } catch (error) {
    console.error(`Release version validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}

const scriptPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (scriptPath === import.meta.url || fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli();
}
