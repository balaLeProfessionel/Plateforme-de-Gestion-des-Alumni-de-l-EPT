/** Compte Google lié au compte connecté, miroir de `LiaisonGoogleResponse`. */
export interface LiaisonGoogle {
  lie: boolean;
  emailGoogle: string | null;
  /** Faux : mot de passe aléatoire (compte créé avec Google), délier n'est pas possible avant d'en définir un. */
  motDePasseDefini: boolean;
}
