import { ParamMap } from '@angular/router';
import { CriteresComptes, LIBELLES_ROLE_COMPTE, RoleCompte, StatutCompte } from '../../core/services/models/admin.model';

export const ROLES_COMPTE = Object.keys(LIBELLES_ROLE_COMPTE) as RoleCompte[];
const STATUTS: readonly StatutCompte[] = ['ACTIF', 'EN_ATTENTE', 'SUSPENDU'];

/** Critères d’une liste de comptes et page courante (à partir de 0), lus dans l’URL. */
export interface EtatListe {
  criteres: CriteresComptes;
  page: number;
}

export function etatDepuis(params: ParamMap, statutImpose: StatutCompte | null = null): EtatListe {
  const role = params.get('role');
  const statut = params.get('statut');
  const page = Number(params.get('page'));
  return {
    criteres: {
      recherche: params.get('recherche')?.trim() ?? '',
      role: ROLES_COMPTE.includes(role as RoleCompte) ? role as RoleCompte : null,
      statut: statutImpose ?? (STATUTS.includes(statut as StatutCompte) ? statut as StatutCompte : null),
    },
    page: Number.isInteger(page) && page > 1 ? page - 1 : 0,
  };
}

/** Paramètres d’URL non vides ; la page est écrite à partir de 1, et omise pour la première. */
export function parametresDepuis(etat: EtatListe, statutImpose = false): Record<string, string> {
  const parametres: Record<string, string> = {};
  if (etat.criteres.recherche) parametres['recherche'] = etat.criteres.recherche;
  if (etat.criteres.role) parametres['role'] = etat.criteres.role;
  if (etat.criteres.statut && !statutImpose) parametres['statut'] = etat.criteres.statut;
  if (etat.page > 0) parametres['page'] = String(etat.page + 1);
  return parametres;
}
