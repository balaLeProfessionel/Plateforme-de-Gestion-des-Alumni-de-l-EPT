export type StatutMentorat = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'ANNULEE' | 'TERMINEE';
export type RoleMentorat = 'MENTOR' | 'MENTORE';
export type ModaliteSeance = 'VISIO' | 'PRESENTIEL' | 'TELEPHONE';
export type StatutSeance = 'PLANIFIEE' | 'REALISEE' | 'ANNULEE';

export interface DomaineMentorat {
  id: string;
  code: string;
  libelle: string;
}

export interface ProfilMentor {
  id: string;
  presentation: string | null;
  disponible: boolean;
  capaciteMax: number;
  mentoresActifs: number;
  domaines: DomaineMentorat[];
}

export interface ProfilMentorRequest {
  presentation: string | null;
  disponible: boolean;
  capaciteMax: number;
  domaineIds: string[];
}

/** Toute personne membre peut être mentor et mentoré ; les comptes d’organisme et d’administration non. */
export const ROLES_MENTORAT: readonly string[] = ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'VISITEUR'];

export const LIBELLES_ROLE_MEMBRE: Record<string, string> = {
  ETUDIANT: 'Étudiant', ALUMNI: 'Alumni', PERSONNEL: 'Personnel', VISITEUR: 'Visiteur',
};

export function participeAuMentorat(role: string | null | undefined): boolean {
  return ROLES_MENTORAT.includes(role ?? '');
}

export interface CompteursMentorat {
  demandesRecuesEnAttente: number;
  demandesEnvoyeesEnAttente: number;
  /** Au-delà, le serveur refuse toute nouvelle demande tant qu’aucune n’a reçu de réponse. */
  demandesEnAttenteMax: number;
}

export interface Mentor {
  profilId: string;
  utilisateurId: string;
  nom: string;
  prenom: string;
  urlPhoto: string | null;
  posteActuel: string | null;
  filiere: string | null;
  anneeSortie: number | null;
  presentation: string | null;
  domaines: DomaineMentorat[];
  disponible: boolean;
  placesRestantes: number;
  demandeEnCours: boolean;
  role: string;
}

export interface ParticipantMentorat {
  id: string;
  nom: string;
  prenom: string;
  urlPhoto: string | null;
  posteActuel: string | null;
  filiere: string | null;
  anneeSortie: number | null;
  role: string;
}

export interface Mentorat {
  id: string;
  statut: StatutMentorat;
  domaine: DomaineMentorat;
  objectif: string;
  motifRefus: string | null;
  creeLe: string;
  reponduLe: string | null;
  clotureLe: string | null;
  mentor: ParticipantMentorat;
  mentore: ParticipantMentorat;
  monRole: RoleMentorat;
  programme: string | null;
}

export interface SeanceMentorat {
  id: string;
  debut: string;
  dureeMinutes: number;
  modalite: ModaliteSeance;
  lieuOuLien: string | null;
  statut: StatutSeance;
  compteRendu: string | null;
  proposeeParId: string;
}

export interface EvaluationMentorat {
  id: string;
  auteurId: string;
  note: number;
  commentaire: string | null;
  creeLe: string;
}

export interface MentoratDetail {
  mentorat: Mentorat;
  seances: SeanceMentorat[];
  evaluations: EvaluationMentorat[];
  peutEvaluer: boolean;
}

export interface SeanceMentoratRequest {
  debut: string;
  dureeMinutes: number;
  modalite: ModaliteSeance;
  lieuOuLien: string | null;
}

export interface Page<T> {
  contenu: T[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}

export interface CriteresMentors {
  recherche: string;
  domaine: string;
  disponibles: boolean;
  page: number;
}

export const LIBELLES_STATUT_MENTORAT: Record<StatutMentorat, string> = {
  EN_ATTENTE: 'En attente',
  ACCEPTEE: 'En cours',
  REFUSEE: 'Refusée',
  ANNULEE: 'Annulée',
  TERMINEE: 'Terminée',
};

/** Ce que signifie l’état pour chacun, et ce qu’il peut faire ensuite. */
export const EXPLICATIONS_STATUT_MENTORAT: Record<StatutMentorat, Record<RoleMentorat, string>> = {
  EN_ATTENTE: {
    MENTORE: 'Votre demande attend la réponse du mentor. Vous pouvez l’annuler tant qu’il n’a pas répondu.',
    MENTOR: 'Cette personne attend votre réponse : acceptez sa demande, ou refusez-la en précisant un motif.',
  },
  ACCEPTEE: {
    MENTORE: 'Le mentor a accepté. Planifiez vos séances ensemble et consignez-les au fil du mentorat.',
    MENTOR: 'Vous accompagnez cette personne. Planifiez vos séances ensemble et consignez-les au fil du mentorat.',
  },
  REFUSEE: {
    MENTORE: 'Le mentor n’a pas pu accepter votre demande. Vous pouvez solliciter un autre mentor.',
    MENTOR: 'Vous avez refusé cette demande ; la personne en a été prévenue.',
  },
  ANNULEE: {
    MENTORE: 'Vous avez annulé cette demande avant la réponse du mentor.',
    MENTOR: 'La personne a annulé sa demande avant votre réponse.',
  },
  TERMINEE: {
    MENTORE: 'Ce mentorat est clôturé. Ses séances restent consultables et vous pouvez l’évaluer.',
    MENTOR: 'Ce mentorat est clôturé. Ses séances restent consultables et vous pouvez l’évaluer.',
  },
};

export const LIBELLES_MODALITE: Record<ModaliteSeance, string> = {
  VISIO: 'Visio',
  PRESENTIEL: 'Présentiel',
  TELEPHONE: 'Téléphone',
};
