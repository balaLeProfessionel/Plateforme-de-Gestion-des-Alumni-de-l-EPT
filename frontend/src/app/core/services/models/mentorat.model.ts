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
}

export interface ParticipantMentorat {
  id: string;
  nom: string;
  prenom: string;
  urlPhoto: string | null;
  posteActuel: string | null;
  filiere: string | null;
  anneeSortie: number | null;
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

export const LIBELLES_MODALITE: Record<ModaliteSeance, string> = {
  VISIO: 'Visio',
  PRESENTIEL: 'Présentiel',
  TELEPHONE: 'Téléphone',
};
