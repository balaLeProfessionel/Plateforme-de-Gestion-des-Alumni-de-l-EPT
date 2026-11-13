export type PeriodeEvenement = 'AVENIR' | 'PASSES';
export type AudienceEvenement = 'ETUDIANTS' | 'ALUMNI' | 'TOUS';
export type StatutEvenement = 'PUBLIE' | 'ANNULE';
export type ReponseParticipation = 'PARTICIPERA' | 'NE_PARTICIPERA_PAS';

export interface Evenement {
  id: string;
  titre: string;
  description: string;
  lieu: string;
  urlImage: string | null;
  dateDebut: string;
  /** Absente pour un événement ponctuel, qui a lieu à la date de début. */
  dateFin: string | null;
  audience: AudienceEvenement;
  nombrePlaces: number | null;
  officielEpt: boolean;
  statut: StatutEvenement;
  organisateurId: string;
  organisateurNom: string;
  organisateurPrenom: string | null;
  /** Fiche de l’organisme organisateur, absente si ce n’est pas un compte organisme. */
  organisateurOrganismeId?: string | null;
  nombreParticipants: number;
  maReponse: ReponseParticipation | null;
  /** Liste des inscrits montrée aux membres ; l’organisateur peut la masquer. */
  participantsVisibles: boolean;
}

export interface EvenementRequest {
  titre: string;
  description: string;
  lieu: string;
  dateDebut: string;
  dateFin: string | null;
  audience: AudienceEvenement;
  nombrePlaces: number | null;
  /** Facultatif côté serveur : sans valeur, la liste est visible. */
  participantsVisibles?: boolean;
}

/** Critères de recherche de la liste des événements. */
export interface FiltresEvenements {
  recherche: string;
  lieu: string;
  officiel: 'oui' | 'non' | '';
  /** Événements organisés par cet organisme (identifiant de l'organisme, pas du compte). */
  organisme?: string;
}

export const AUCUN_FILTRE: FiltresEvenements = { recherche: '', lieu: '', officiel: '' };

export interface ParticipantEvenement {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  urlPhoto: string | null;
}

export interface PageParticipants {
  contenu: ParticipantEvenement[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}

export interface PageEvenements {
  contenu: Evenement[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}
