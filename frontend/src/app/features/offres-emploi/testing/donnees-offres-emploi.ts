import { signal } from '@angular/core';
import { Page } from '../../../core/services/models/mentorat.model';
import { OffreEmploi } from '../../../core/services/models/offre-emploi.model';

/** Une offre relayée publiée ; `changement` remplace les champs voulus. */
export function uneOffreEmploi(changement: Partial<OffreEmploi> = {}): OffreEmploi {
  return {
    id: 'e1', mode: 'RELAYEE', titre: 'Développeur Java', description: 'Maintenir le portail des clients.', entreprise: 'Kër Data',
    organismeId: null, typeContrat: 'CDI', lieu: 'Dakar', dateExpiration: '2027-01-31', expiree: false,
    lienSource: 'https://emplois.example.sn/42', source: 'LinkedIn', competences: ['Java', 'SQL'], filieres: [],
    statut: 'PUBLIEE', motifDecision: null,
    auteur: { id: 'a1', prenom: 'Awa', nom: 'Diop', photo: null, role: 'ALUMNI', anneeSortie: 2019, filiere: 'Génie informatique', organismeId: null },
    publieeLe: '2026-11-20T10:00:00', creeeLe: '2026-11-20T10:00:00', modifiable: false, signalable: true,
    ...changement,
  };
}

export function pageDOffresEmploi(contenu: OffreEmploi[]): Page<OffreEmploi> {
  return { contenu, page: 0, taille: 12, totalElements: contenu.length, totalPages: 1 };
}

/** Doublure d’AuthService réduite au rôle. */
export function authEmploi(role: string) {
  return { utilisateur: signal({ id: 'moi', role }), aPermission: () => false, estConnecte: () => true };
}
