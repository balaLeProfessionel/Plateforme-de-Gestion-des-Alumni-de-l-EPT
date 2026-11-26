// Miroirs TypeScript des DTO du backend (package cv).

export type StatutImportCv = 'EN_COURS' | 'PRET' | 'ECHEC' | 'VALIDE' | 'ABANDONNE';

export interface DisponibiliteImportCv {
  disponible: boolean;
  imagesAcceptees: boolean;
  /** Nom du service qui lira le CV, montré dans le consentement. */
  fournisseur: string | null;
  fichiersMax: number;
  tailleMaxOctets: number;
}

/** Les dates extraites sont « AAAA-MM », ou « AAAA » quand le CV ne donne pas le mois. */
export interface IdentiteExtraite {
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  villeResidence: string | null;
  paysResidence: string | null;
  posteActuel: string | null;
  bio: string | null;
  lienLinkedin: string | null;
  lienPortfolio: string | null;
}

export interface FormationExtraite {
  libelle: string;
  etablissement: string | null;
  typeFormation: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  enCours: boolean | null;
  description: string | null;
}

export interface ExperienceExtraite {
  poste: string;
  organisme: string | null;
  typeContrat: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  enCours: boolean | null;
  estStage: boolean | null;
  description: string | null;
}

export interface LangueExtraite {
  code: string;
  niveau: string | null;
}

export interface ProfilExtrait {
  identite: IdentiteExtraite;
  formations: FormationExtraite[];
  experiences: ExperienceExtraite[];
  competences: string[];
  langues: LangueExtraite[];
}

export interface ImportCv {
  id: string;
  statut: StatutImportCv;
  typeSource: 'TEXTE' | 'IMAGES';
  message: string | null;
  profil: ProfilExtrait | null;
  expireLe: string | null;
}
