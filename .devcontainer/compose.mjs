import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { prepareEnvironment, previewHost, projectRoot } from './setup.mjs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage : node .devcontainer/compose.mjs <commande Docker Compose>');
  process.exit(1);
}

const { dataDirectory, envFile, variables } = prepareEnvironment();
const child = spawn('docker', [
  'compose', '--project-name', 'alumni-codespace', '--project-directory', projectRoot,
  '--env-file', envFile,
  '-f', join(projectRoot, 'docker-compose.yml'),
  '-f', join(projectRoot, '.devcontainer', 'compose.codespaces.yml'),
  ...args,
], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    ...variables,
    DEV_WEB_PORT: '4200',
    ALUMNI_CODESPACE_DATA_DIR: dataDirectory,
    ALUMNI_PREVIEW_HOST: previewHost(),
  },
});
child.on('error', (error) => {
  console.error(`Docker Compose indisponible : ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', (code) => { process.exitCode = code ?? 1; });
