import { signal } from '@angular/core';
import { Page } from '../../../core/services/models/mentorat.model';
import { CandidatureRecueEmploi, MaCandidatureEmploi, OffreEmploi } from '../../../core/services/models/offre-emploi.model';

/** Une offre relayée publiée ; `changement` remplace les champs voulus. */
export function uneOffreEmploi(changement: Partial<OffreEmploi> = {}): OffreEmploi {
  return {
    id: 'e1', mode: 'RELAYEE', titre: 'Développeur Java', description: 'Maintenir le portail des clients.', entreprise: 'Kër Data',
    organismeId: null, typeContrat: 'CDI', lieu: 'Dakar', dateExpiration: '2027-01-31', expiree: false,
    lienSource: 'https://emplois.example.sn/42', source: 'LinkedIn', competences: ['Java', 'SQL'], filieres: [],
    statut: 'PUBLIEE', motifDecision: null,
    auteur: { id: 'a1', prenom: 'Awa', nom: 'Diop', photo: null, role: 'ALUMNI', anneeSortie: 2019, filiere: 'Génie informatique', organismeId: null },
    publieeLe: '2026-11-20T10:00:00', creeeLe: '2026-11-20T10:00:00', modifiable: false, signalable: true,
    lettreExigee: false, questions: [], cloturee: false, candidaturesConsultables: false,
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

/** Une offre gérée publiée par l’organisme o1, sans lettre exigée ni question ; `changement` remplace les champs voulus. */
export function uneOffreGeree(changement: Partial<OffreEmploi> = {}): OffreEmploi {
  return uneOffreEmploi({
    id: 'g1', mode: 'GEREE', titre: 'Ingénieur réseaux', entreprise: 'Sonatel', organismeId: 'o1', lienSource: null, source: null,
    signalable: false, ...changement,
  });
}

/** La candidature du membre connecté à l’offre g1, reçue ; `changement` remplace les champs voulus. */
export function uneCandidatureEmploi(changement: Partial<MaCandidatureEmploi> = {}): MaCandidatureEmploi {
  return {
    id: 'c1', offreId: 'g1', titreOffre: 'Ingénieur réseaux', entreprise: 'Sonatel', dateExpiration: '2027-01-31', offreExpiree: false,
    statut: 'RECUE', nomCv: 'cv-awa.pdf', lettreMotivation: null, reponses: [], envoyeeLe: '2026-11-25T09:00:00', retireeLe: null,
    retirable: true, ...changement,
  };
}

/** Candidature reçue par l’offre g1, vue par le recruteur ; `changement` remplace les champs voulus. */
export function uneCandidatureRecue(changement: Partial<CandidatureRecueEmploi> = {}): CandidatureRecueEmploi {
  return {
    id: 'r1',
    candidat: {
      id: 'u1', prenom: 'Awa', nom: 'Diop', role: 'ALUMNI', urlPhoto: null, filiere: 'Génie informatique', classe: null,
      anneeEntree: 2014, anneeSortie: 2019, competences: ['Java', 'Kubernetes'],
    },
    statut: 'RECUE', statutsSuivants: ['PRESELECTIONNEE', 'ENTRETIEN', 'RETENUE', 'NON_RETENUE'], nomCv: 'cv-awa.pdf', cvDisponible: true,
    lettreMotivation: 'Je suis motivée.', reponses: [{ questionId: 'q1', intitule: 'Permis B ?', valeur: 'OUI' }], notePrivee: null,
    envoyeeLe: '2026-11-25T09:00:00', historique: [{ statut: 'RECUE', le: '2026-11-25T09:00:00', auteur: 'le candidat' }],
    ...changement,
  };
}
