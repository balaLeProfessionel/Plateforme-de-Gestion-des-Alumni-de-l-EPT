import { Service, signal } from '@angular/core';

/** Ce que Google a dit d’une personne sans compte, avec le jeton qui le prouve. */
export interface IdentiteInscriptionGoogle {
  credential: string;
  email: string;
  prenom: string;
  nom: string;
}

/**
 * Inscription avec Google en cours : retenue entre le bouton Google, le choix du profil et le formulaire.
 * Gardée en mémoire seulement (jamais dans le stockage du navigateur) : un rechargement la fait oublier,
 * il suffit alors de cliquer à nouveau sur le bouton Google.
 */
@Service()
export class InscriptionGoogle {
  private readonly enAttenteSignal = signal<IdentiteInscriptionGoogle | null>(null);
  readonly enAttente = this.enAttenteSignal.asReadonly();

  retenir(identite: IdentiteInscriptionGoogle): void {
    this.enAttenteSignal.set(identite);
  }

  oublier(): void {
    this.enAttenteSignal.set(null);
  }
}
