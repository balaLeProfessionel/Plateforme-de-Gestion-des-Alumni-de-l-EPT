import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { test } from 'node:test';
import { prepareEnvironment, projectRoot } from './setup.mjs';

test('le Compose personnel préserve watch et isole les ports et le stockage', () => {
  const { dataDirectory, envFile } = prepareEnvironment();
  const original = JSON.parse(execFileSync('docker', [
    'compose', '--env-file', envFile, '-f', join(projectRoot, 'docker-compose.yml'),
    'config', '--format', 'json',
  ], { encoding: 'utf8' }));
  const codespaces = JSON.parse(execFileSync(process.execPath, [
    join(projectRoot, '.devcontainer', 'compose.mjs'), 'config', '--format', 'json',
  ], {
    encoding: 'utf8',
    env: {
      ...process.env,
      CODESPACES: 'true',
      CODESPACE_NAME: 'validation-alumni-123',
      GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: 'app.github.dev',
    },
  }));

  assert.deepEqual(codespaces.services.api.develop, original.services.api.develop);
  assert.deepEqual(codespaces.services.web.develop, original.services.web.develop);
  assert.deepEqual(codespaces.services.db.ports ?? [], []);
  assert.deepEqual(codespaces.services.api.ports ?? [], []);
  assert.equal(codespaces.services.web.ports.length, 1);
  assert.equal(codespaces.services.web.ports[0].published, '4200');
  assert.equal(codespaces.services.api.environment.APP_STORAGE_PHOTOS_DIR, '/data/alumni/photos');
  assert.equal(codespaces.services.api.environment.APP_CORS_ALLOWED_ORIGINS,
    'http://localhost:4200,https://validation-alumni-123-4200.app.github.dev');
  for (const [service, target, directory] of [
    ['db', '/var/lib/postgresql/data', 'postgres'],
    ['api', '/data/alumni/photos', 'photos'],
  ]) {
    const mount = codespaces.services[service].volumes.find((volume) => volume.target === target);
    assert.equal(mount.type, 'bind');
    assert.equal(mount.source.replaceAll('\\', '/'), `${dataDirectory.replaceAll('\\', '/')}/${directory}`);
  }
  assert.equal(codespaces.services.web.environment.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS,
    'validation-alumni-123-4200.app.github.dev');
});
