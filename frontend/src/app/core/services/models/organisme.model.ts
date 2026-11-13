// Resultat de /api/organisme/recherche : juste de quoi alimenter l'autocomplete
export interface OrganismeSuggestion {
  id: string;
  nom: string;
}

export interface OrganismePublic {
  id: string;
  nom: string;
  description: string | null;
  secteurActivite: string | null;
  typeOrganisme: 'ENTREPRISE' | 'ETABLISSEMENT_ENSEIGNEMENT' | 'INSTITUTION_PUBLIQUE' | 'ONG' | 'AUTRE' | null;
  adresse: string | null;
  pays: string | null;
  siteWeb: string | null;
  logoUrl: string | null;
  statutJuridique: string | null;
  trancheEffectif: string | null;
  dateCreation: string | null;
  statutCompte: 'ACTIF' | 'EN_ATTENTE';
}

/** Membre passé par l'organisme : poste en cours, sinon le dernier occupé. */
export interface MembreOrganisme {
  id: string;
  prenom: string | null;
  nom: string;
  urlPhoto: string | null;
  role: string;
  poste: string | null;
  actuel: boolean;
  anneeDebut: number | null;
  anneeFin: number | null;
}

/** Onglets « Actuellement » et « Anciens » ; sans valeur, tous les membres. */
export type PresenceMembre = 'ACTUELS' | 'ANCIENS';

/**
 * Ceux qui y sont encore viennent en premier. `totalElements` compte le groupe demandé,
 * `actuels` et `anciens` chaque groupe (recherche comprise), pour les onglets.
 */
export interface PageMembresOrganisme {
  contenu: MembreOrganisme[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
  actuels: number;
  anciens: number;
}

/** Ce que l'en-tête de la fiche montre du réseau : les deux comptes et quelques visages. */
export interface ResumeReseauOrganisme {
  actuels: number;
  anciens: number;
  apercu: readonly MembreOrganisme[];
}
