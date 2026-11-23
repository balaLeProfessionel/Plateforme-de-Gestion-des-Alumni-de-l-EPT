import { signal } from '@angular/core';
import { Filiere } from '../models/filiere.model';
import { FilieresService } from './filieres';

/** Les cinq filières de départ, comme le serveur les crée au premier démarrage. */
export const FILIERES_DE_TEST: readonly Filiere[] = [
  { id: 'f-aero', nom: 'Génie Aéronautique et Aérospatial' },
  { id: 'f-civil', nom: 'Génie Civil' },
  { id: 'f-electro', nom: 'Génie Électromécanique' },
  { id: 'f-indus', nom: 'Génie Industriel' },
  { id: 'f-git', nom: 'Génie Informatique et Télécommunications' },
];

/** Doublure de FilieresService pour les pages qui ne font que lire la liste proposée. */
export function fournirFilieres() {
  return {
    provide: FilieresService,
    useValue: { proposees: () => signal(FILIERES_DE_TEST).asReadonly(), recharger: () => undefined },
  };
}
