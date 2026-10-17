import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function prepareEnvironment(root = projectRoot) {
  const dataDirectory = join(root, '.local', 'codespaces');
  const envFile = join(dataDirectory, '.env');
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });

  if (!existsSync(envFile) && ['postgres', 'photos'].some((directory) => {
    const path = join(dataDirectory, directory);
    if (!existsSync(path)) return false;
    try {
      return readdirSync(path).length > 0;
    } catch (error) {
      if (error.code === 'EACCES') return true;
      throw error;
    }
  })) {
    throw new Error('Des données existent sans leurs clés. Restaurer .local/codespaces/.env depuis sa sauvegarde.');
  }

  // These keys must survive a rebuild so that existing accounts and sessions remain usable.
  try {
    writeFileSync(envFile, [
      'POSTGRES_DB=alumni_db',
      'POSTGRES_USER=alumni_dev',
      `POSTGRES_PASSWORD=${randomBytes(24).toString('hex')}`,
      `JWT_SECRET=${randomBytes(64).toString('base64')}`,
      '',
    ].join('\n'), { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }

  const variables = Object.fromEntries(readFileSync(envFile, 'utf8').trim().split(/\r?\n/)
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }));

  if (variables.POSTGRES_DB !== 'alumni_db' || variables.POSTGRES_USER !== 'alumni_dev'
    || !/^[a-f0-9]{48}$/.test(variables.POSTGRES_PASSWORD ?? '')
    || !/^[A-Za-z0-9+/]{86}==$/.test(variables.JWT_SECRET ?? '')) {
    throw new Error('Configuration Codespaces invalide. Restaurer .local/codespaces/.env depuis sa sauvegarde.');
  }

  chmodSync(envFile, 0o600);
  for (const directory of ['postgres', 'photos', 'backups']) {
    mkdirSync(join(dataDirectory, directory), { recursive: true, mode: 0o700 });
  }
  return { dataDirectory, envFile, variables };
}

export function previewHost(environment = process.env) {
  if (environment.CODESPACES !== 'true') return 'localhost';
  const name = environment.CODESPACE_NAME;
  const domain = environment.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  if (!/^[a-z0-9-]+$/.test(name ?? '')
    || !/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(domain ?? '')) {
    throw new Error('Nom ou domaine du Codespace absent ou invalide.');
  }
  return `${name}-4200.${domain}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareEnvironment();
  const name = process.env.ALUMNI_GIT_NAME;
  const email = process.env.ALUMNI_GIT_EMAIL;
  if (name && email) {
    for (const [key, value] of [['user.name', name], ['user.email', email]]) {
      const result = spawnSync('git', ['config', '--local', key, value], { cwd: projectRoot, stdio: 'inherit' });
      if (result.error) throw result.error;
      if (result.status !== 0) process.exit(result.status ?? 1);
    }
  }
  console.log('Configuration prête. Lancer : node .devcontainer/compose.mjs up --build --watch');
}
