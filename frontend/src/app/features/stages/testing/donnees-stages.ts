import { signal } from '@angular/core';
import { Page } from '../../../core/services/models/mentorat.model';
import { OffreStage } from '../../../core/services/models/stage.model';

/** Une offre publiée et ouverte ; `changement` remplace les champs voulus. */
export function uneOffre(changement: Partial<OffreStage> = {}): OffreStage {
  return {
    id: 'o1', titre: 'Développeur web', description: 'Développer le portail client.', competences: 'Angular, Java',
    dureeMois: 4, typeStage: 'PFE', lieu: 'Dakar', dateDebutPrevue: null, nombrePlaces: 2, dateLimiteCandidature: '2026-12-15',
    candidaturesOuvertes: true, statut: 'PUBLIEE', motifDecision: null, publieeLe: '2026-11-01T10:00:00Z', creeeLe: '2026-11-01T10:00:00Z',
    organisme: { id: 'org1', nom: 'Kër Data', logoUrl: null },
    urlImage: null, piecesJointes: [], modifiable: false, nombreCandidatures: null,
    ...changement,
  };
}

export function pageDOffres(contenu: OffreStage[], numero = 0, totalPages = 1): Page<OffreStage> {
  return { contenu, page: numero, taille: 12, totalElements: contenu.length, totalPages };
}

/** Doublure d’AuthService : un rôle et, pour un administrateur, ses permissions. */
export function authStages(role: string, permissions: readonly string[] = []) {
  return {
    utilisateur: signal({ id: 'moi', role }),
    aPermission: (permission: string) => permissions.includes(permission),
    estConnecte: () => true,
  };
}

/** Un stage confirmé dans le suivi (STA-08) ; `changement` remplace les champs voulus. */
export function unSuivi(changement: Partial<import('../../../core/services/models/stage.model').SuiviStage> = {}):
    import('../../../core/services/models/stage.model').SuiviStage {
  return {
    id: 's1', offreId: 'o1', etudiant: { id: 'e1', prenom: 'Awa', nom: 'Diop', filiere: 'Génie Civil', classe: 'DIC2', anneeEntree: 2023, urlPhoto: null },
    email: 'awa@ept.sn', organismeId: 'org1', organisme: 'Kër Data', typeStage: 'PFE', sujet: 'Portail client', lieu: 'Dakar',
    dateDebut: '2027-02-01', dateFin: '2027-06-30', deroulement: 'A_VENIR', encadrant: null,
    tuteurNom: 'Moussa Ndiaye', tuteurFonction: 'CTO', tuteurEmail: null, tuteurTelephone: null, declare: false,
    ...changement,
  };
}
