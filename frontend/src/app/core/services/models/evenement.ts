export type PeriodeEvenement = 'AVENIR' | 'PASSES';
export type AudienceEvenement = 'ETUDIANTS' | 'ALUMNI' | 'TOUS';
export type StatutEvenement = 'PUBLIE' | 'ANNULE';
export type ReponseParticipation = 'PARTICIPERA' | 'NE_PARTICIPERA_PAS';

export interface Evenement {
  id: string;
  titre: string;
  description: string;
  lieu: string;
  dateDebut: string;
  dateFin: string;
  audience: AudienceEvenement;
  nombrePlaces: number | null;
  officielEpt: boolean;
  statut: StatutEvenement;
  organisateurId: string;
  organisateurNom: string;
  organisateurPrenom: string;
  nombreParticipants: number;
  maReponse: ReponseParticipation | null;
}

export interface PageEvenements {
  contenu: Evenement[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}
