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
  /** Annulation décidée par la plateforme (le mentor a quitté le programme), déjà rédigée. */
  motifAnnulation: string | null;
  creeLe: string;
  reponduLe: string | null;
  clotureLe: string | null;
  mentor: ParticipantMentorat;
  mentore: ParticipantMentorat;
  monRole: RoleMentorat;
  /** Le programme auquel la demande a été rattachée ; null pour un mentorat libre. */
  programme: ProgrammeResume | null;
}

export interface ProgrammeResume {
  id: string;
  titre: string;
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
  /** Étapes du programme et leur avancement ; vide pour un mentorat libre. */
  etapes: EtapeSuivie[];
  peutEvaluer: boolean;
}

/** Une étape du programme vue depuis un mentorat ; `franchieLe` est null tant qu’elle n’est pas validée. */
export interface EtapeSuivie {
  id: string;
  ordre: number;
  titre: string;
  description: string | null;
  franchieLe: string | null;
  valideePar: string | null;
  commentaire: string | null;
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
  /** Mentors volontaires d’un programme seulement. */
  programme?: string;
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

/** L’explication d’un mentorat : le motif d’une annulation par la plateforme prime sur le texte du statut. */
export function explicationMentorat(mentorat: Pick<Mentorat, 'statut' | 'monRole' | 'motifAnnulation'>): string {
  return mentorat.statut === 'ANNULEE' && mentorat.motifAnnulation
    ? mentorat.motifAnnulation
    : EXPLICATIONS_STATUT_MENTORAT[mentorat.statut][mentorat.monRole];
}

export const LIBELLES_MODALITE: Record<ModaliteSeance, string> = {
  VISIO: 'Visio',
  PRESENTIEL: 'Présentiel',
  TELEPHONE: 'Téléphone',
};

// ---------- Programmes de mentorat ----------

export type StatutProgramme = 'BROUILLON' | 'OUVERT' | 'EN_COURS' | 'CLOS';

/** Seule l’administration crée et gère les programmes. */
export const ROLES_GESTION_PROGRAMMES: readonly string[] = ['ADMIN'];

export function gereLesProgrammes(role: string | null | undefined): boolean {
  return ROLES_GESTION_PROGRAMMES.includes(role ?? '');
}

export const LIBELLES_STATUT_PROGRAMME: Record<StatutProgramme, string> = {
  BROUILLON: 'Brouillon',
  OUVERT: 'Ouvert',
  EN_COURS: 'En cours',
  CLOS: 'Clos',
};

export interface EtapeProgramme {
  id: string;
  titre: string;
  description: string | null;
  ordre: number;
}

export interface Programme {
  id: string;
  titre: string;
  description: string | null;
  /** Jour « AAAA-MM-JJ ». */
  dateDebut: string;
  dateFin: string;
  statut: StatutProgramme;
  responsable: ParticipantMentorat;
  etapes: EtapeProgramme[];
  nombreMentorats: number;
  /** Mentors volontaires inscrits au programme. */
  nombreMentors: number;
  /** Je peux le modifier : administration. */
  gerable: boolean;
  /** J’y suis mentor volontaire. */
  jeParticipe: boolean;
  /** Sa date de fin est passée : plus de nouvelle demande ni de nouveau mentor volontaire. */
  termine: boolean;
}

/** Liste complète des étapes dans l’ordre voulu ; une étape sans id est créée, une étape absente retirée. */
export interface ProgrammeRequest {
  titre: string;
  description: string | null;
  dateDebut: string;
  dateFin: string;
  etapes: { id: string | null; titre: string; description: string | null }[];
}

/** Tableau de bord d’un programme pour l’administration : avancement, sans le contenu des mentorats. */
export interface TableauProgramme {
  enAttente: number;
  enCours: number;
  terminees: number;
  /** Demandes refusées ou annulées. */
  sansSuite: number;
  /** Part des étapes franchies par les mentorats suivis (en cours ou terminés), en %. */
  progressionMoyenne: number;
  etapes: AvancementEtape[];
  mentorats: MentoratDeProgramme[];
  mentors: MentorVolontaire[];
}

export interface AvancementEtape {
  id: string;
  ordre: number;
  titre: string;
  franchies: number;
  /** Mentorats en cours ou terminés, qui peuvent franchir l’étape. */
  suivis: number;
}

export interface MentoratDeProgramme {
  id: string;
  statut: StatutMentorat;
  mentor: ParticipantMentorat;
  mentore: ParticipantMentorat;
  etapesFranchies: number;
  creeLe: string;
}

export interface MentorVolontaire {
  mentor: ParticipantMentorat;
  mentoresEnCours: number;
  disponible: boolean;
}
