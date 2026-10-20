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
  dateFin: string;
  audience: AudienceEvenement;
  nombrePlaces: number | null;
  officielEpt: boolean;
  statut: StatutEvenement;
  organisateurId: string;
  organisateurNom: string;
  organisateurPrenom: string | null;
  nombreParticipants: number;
  maReponse: ReponseParticipation | null;
}

export interface EvenementRequest {
  titre: string;
  description: string;
  lieu: string;
  dateDebut: string;
  dateFin: string;
  audience: AudienceEvenement;
  nombrePlaces: number | null;
}

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
