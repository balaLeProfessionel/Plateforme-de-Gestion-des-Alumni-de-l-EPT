/** Miroir de FiliereResponse : une filière proposée dans les listes. */
export interface Filiere {
  id: string;
  nom: string;
}

/** Miroir de FiliereAdminResponse : une ligne de l’écran « Filières ». */
export interface FiliereAdmin {
  id: string;
  nom: string;
  /** Une filière retirée n’est plus proposée, mais reste sur les comptes qui l’ont. */
  active: boolean;
  nombreComptes: number;
  chef: ChefDepartement | null;
}

export interface ChefDepartement {
  id: string;
  prenom: string;
  nom: string;
  designeLe: string;
}

/** Miroir de ChefPossibleResponse : compte actif du personnel. */
export interface ChefPossible {
  id: string;
  prenom: string;
  nom: string;
  email: string;
}
