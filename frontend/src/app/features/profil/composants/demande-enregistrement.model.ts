// Charge utile d'un enregistrement de carte.
// id vaut null pour une creation ; la cle sert a la page pour cibler le
// retour visuel sur la bonne carte. Le type des donnees varie selon la
// section (experience ou formation), d'ou le parametre generique.
export interface DemandeEnregistrement<T> {
  readonly id: string | null;
  readonly cle: string;
  readonly donnees: T;
}

// Resultat de la collecte d'une carte en mode global.
// On distingue explicitement "rien a enregistrer" de "saisie invalide" :
// une carte inchangee ne doit declencher aucune requete, alors qu'une carte
// invalide doit bloquer l'enregistrement de l'ensemble.
export type ResultatCollecte<T> =
  | { readonly statut: 'invalide' }
  | { readonly statut: 'inchangee' }
  | { readonly statut: 'valide'; readonly demande: DemandeEnregistrement<T> };

export type ModeEnregistrement = 'global' | 'parCarte';
