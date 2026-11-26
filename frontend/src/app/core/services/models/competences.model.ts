// Miroirs TypeScript des DTO du backend (package competence).

export type NiveauLangue = 'NOTIONS' | 'INTERMEDIAIRE' | 'COURANT' | 'BILINGUE' | 'MATERNELLE';

export interface Langue {
  /** Code ISO 639 : deux lettres, ou trois pour le sérère, le diola, le soninké, le mandingue. */
  code: string;
  niveau: NiveauLangue;
}

export interface CompetencesLangues {
  competences: string[];
  langues: Langue[];
}

export interface CompetenceSuggestion {
  libelle: string;
}
