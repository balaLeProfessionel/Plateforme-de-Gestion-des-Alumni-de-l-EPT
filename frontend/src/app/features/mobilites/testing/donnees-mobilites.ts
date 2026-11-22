import { Page } from '../../../core/services/models/mentorat.model';
import { OffreMobilite } from '../../../core/services/models/mobilite.model';

/** Une offre de mobilité publiée ; `changement` remplace les champs voulus. */
export function uneOffreMobilite(changement: Partial<OffreMobilite> = {}): OffreMobilite {
  return {
    id: 'm1', titre: 'Semestre d’échange', description: 'Cours en génie logiciel', type: 'ECHANGE', publicVise: 'ETUDIANTS',
    pays: 'Canada', ville: 'Québec', anneeUniversitaire: '2027-2028', periode: 'SEMESTRE_1', dureeSemaines: null, nombrePlaces: 3,
    dateLimite: '2027-03-15', candidaturesOuvertes: true, statut: 'PUBLIEE', motifRetrait: null, publieeLe: '2026-11-01T10:00:00Z',
    organisme: { id: 'u1', nom: 'Université Laval', logoUrl: null, pays: 'Canada' }, filieres: [], classes: [],
    piecesDemandees: ['LETTRE_MOTIVATION'], piecesJointes: [], modifiable: false, eligibilite: { eligible: true, raison: null }, nombreCandidatures: null,
    ...changement,
  };
}

export function pageDOffresMobilite(contenu: OffreMobilite[]): Page<OffreMobilite> {
  return { contenu, page: 0, taille: 12, totalElements: contenu.length, totalPages: 1 };
}
