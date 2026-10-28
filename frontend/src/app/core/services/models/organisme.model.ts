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
