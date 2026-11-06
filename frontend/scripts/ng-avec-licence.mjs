// Lance Angular CLI en injectant la licence PrimeNG à la compilation : le navigateur ne peut pas lire `.env`.
// La licence vient de l'environnement (Docker), sinon du `.env` à la racine du dépôt (lancement hors Docker).
// Sans licence, l'application fonctionne mais PrimeNG affiche sa bannière de licence invalide.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fichierEnv = fileURLToPath(new URL('../../.env', import.meta.url));

function licenceDuFichierEnv() {
  if (!existsSync(fichierEnv)) return '';
  const ligne = readFileSync(fichierEnv, 'utf8').split(/\r?\n/).find((texte) => texte.startsWith('PRIMENG_LICENSE='));
  return ligne?.slice('PRIMENG_LICENSE='.length).trim() ?? '';
}

const licence = process.env.PRIMENG_LICENSE?.trim() || licenceDuFichierEnv();
const [commande, ...options] = process.argv.slice(2);
const define = licence ? [`--define=PRIMENG_LICENSE=${JSON.stringify(licence)}`] : [];
const ng = fileURLToPath(new URL('../node_modules/@angular/cli/bin/ng.js', import.meta.url));

const resultat = spawnSync(process.execPath, [ng, commande, ...define, ...options], { stdio: 'inherit' });
process.exit(resultat.status ?? 1);
