import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { prepareEnvironment, previewHost } from './setup.mjs';

function temporaryProject(t) {
  const parent = resolve(tmpdir());
  const root = mkdtempSync(join(parent, 'alumni-codespaces-'));
  t.after(() => {
    assert.equal(dirname(root), parent);
    assert.match(basename(root), /^alumni-codespaces-/);
    rmSync(root, { recursive: true, force: true });
  });
  return root;
}

test('une reprise conserve les identifiants et les fichiers des membres', (t) => {
  const root = temporaryProject(t);
  const first = prepareEnvironment(root);
  const photo = join(first.dataDirectory, 'photos', 'avatar.png');
  writeFileSync(photo, 'image de test');
  const second = prepareEnvironment(root);
  assert.deepEqual(second.variables, first.variables);
  assert.equal(readFileSync(photo, 'utf8'), 'image de test');
  assert.equal(Buffer.from(first.variables.JWT_SECRET, 'base64').length, 64);
  if (process.platform !== 'win32') assert.equal(statSync(first.envFile).mode & 0o777, 0o600);
});

test('deux espaces personnels obtiennent des clés distinctes', (t) => {
  const first = prepareEnvironment(temporaryProject(t));
  const second = prepareEnvironment(temporaryProject(t));
  assert.notEqual(first.variables.POSTGRES_PASSWORD, second.variables.POSTGRES_PASSWORD);
  assert.notEqual(first.variables.JWT_SECRET, second.variables.JWT_SECRET);
});

test('une configuration abîmée est refusée sans remplacer les clés existantes', (t) => {
  const root = temporaryProject(t);
  const { envFile } = prepareEnvironment(root);
  writeFileSync(envFile, 'POSTGRES_PASSWORD=configuration-incomplete\n');
  assert.throws(() => prepareEnvironment(root), /Configuration Codespaces invalide/);
  assert.equal(readFileSync(envFile, 'utf8'), 'POSTGRES_PASSWORD=configuration-incomplete\n');
});

test('des clés perdues ne sont pas régénérées devant une base existante', (t) => {
  const root = temporaryProject(t);
  const { envFile, dataDirectory } = prepareEnvironment(root);
  writeFileSync(join(dataDirectory, 'postgres', 'PG_VERSION'), '16');
  rmSync(envFile);
  assert.throws(() => prepareEnvironment(root), /Des données existent sans leurs clés/);
});

test('seul le domaine exact de cet aperçu est ajouté aux hôtes autorisés', () => {
  assert.equal(previewHost({}), 'localhost');
  assert.equal(previewHost({
    CODESPACES: 'true',
    CODESPACE_NAME: 'mon-espace-123',
    GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: 'app.github.dev',
  }), 'mon-espace-123-4200.app.github.dev');
  assert.throws(() => previewHost({ CODESPACES: 'true' }), /absent ou invalide/);
  assert.throws(() => previewHost({
    CODESPACES: 'true',
    CODESPACE_NAME: 'mon-espace-123',
    GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: '.github.dev,*',
  }), /absent ou invalide/);
});
