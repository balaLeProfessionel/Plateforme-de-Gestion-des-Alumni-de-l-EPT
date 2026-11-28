import { Component, ElementRef, Injector, inject, signal } from '@angular/core';
import { form, FormField, minLength, pattern, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { ChampFormulaire } from '../../../shared/formulaires/champ-formulaire/champ-formulaire';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';

type Champ = 'code' | 'nouveauMotDePasse' | 'confirmation';

@Component({
  selector: 'app-reinitialiser-mot-de-passe',
  imports: [FormField, RouterLink, ChampFormulaire],
  templateUrl: './reinitialiser-mot-de-passe.html',
  styleUrl: './reinitialiser-mot-de-passe.scss'
})
export class ReinitialiserMotDePasse {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly email = inject(ActivatedRoute).snapshot.queryParamMap.get('email') ?? '';

  protected readonly modele = signal({
    code: '',
    nouveauMotDePasse: '',
    confirmation: ''
  });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.code, { message: 'Le code est obligatoire' });
    pattern(champ.code, /^\d{6}$/, { message: 'Le code contient 6 chiffres' });
    required(champ.nouveauMotDePasse, { message: 'Le nouveau mot de passe est obligatoire' });
    minLength(champ.nouveauMotDePasse, 8, { message: 'Au moins 8 caractères' });
    required(champ.confirmation, { message: 'Confirmez le nouveau mot de passe' });
    validate(champ.confirmation, ({ value, valueOf }) =>
      value() && value() !== valueOf(champ.nouveauMotDePasse)
        ? { kind: 'differents', message: 'Les deux mots de passe ne correspondent pas' } : undefined);
  });
  protected readonly enChargement = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly afficherNouveau = signal(false);
  protected readonly afficherConfirmation = signal(false);
  // L'utilisateur a déjà essayé de valider : toutes les erreurs s'affichent
  private readonly tentee = signal(false);

  constructor() {
    if (!this.email) {
      this.router.navigate(['/mot-de-passe-oublie']);
    }
  }

  /** Erreur affichée après une saisie quittée ou un essai de validation, pas à l'arrivée. */
  protected erreur(nom: Champ): string | null {
    const champ = this.formulaire[nom]();
    const montrer = (champ.touched() && champ.dirty()) || this.tentee();
    return montrer && champ.invalid() ? (champ.errors()[0]?.message ?? null) : null;
  }

  protected reinitialiser(): void {
    this.tentee.set(true);
    if (this.formulaire().invalid()) {
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
      return;
    }

    const { code, nouveauMotDePasse } = this.modele();
    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.authService.reinitialiserMotDePasse(this.email, code, nouveauMotDePasse).subscribe({
      next: () => {
        this.enChargement.set(false);
        this.router.navigate(['/connexion'], {
          state: { message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' }
        });
      },
      error: (err: { error?: { message?: string } }) => {
        this.enChargement.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de réinitialiser le mot de passe.');
      }
    });
  }
}
