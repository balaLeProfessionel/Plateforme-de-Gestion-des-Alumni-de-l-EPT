import { CompteAdmin } from '../../../core/services/models/admin.model';
import { Page } from '../../../core/services/models/mentorat.model';

/** Compte de test : une alumni active, sans décision, à surcharger champ par champ. */
export function compte(changement: Partial<CompteAdmin> = {}): CompteAdmin {
  return {
    id: 'c1', prenom: 'Awa', nom: 'Diop', email: 'awa.diop@example.invalid', telephone: null, role: 'ALUMNI',
    statutCompte: 'ACTIF', filiere: 'Génie informatique', anneeEntree: 2016, anneeSortie: 2019, nomOrganisme: null,
    organismeId: null, urlPhoto: null, dateCreation: '2026-10-01T09:00:00', motifSuspension: null, nombreDecisions: 0,
    ...changement,
  };
}

export function pageDe(contenu: CompteAdmin[], numero = 0, totalPages = 1): Page<CompteAdmin> {
  return { contenu, page: numero, taille: 20, totalElements: totalPages > 1 ? 20 * totalPages : contenu.length, totalPages };
}
