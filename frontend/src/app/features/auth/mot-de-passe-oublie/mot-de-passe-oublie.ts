import { Component, ElementRef, Injector, computed, inject, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { ChampFormulaire } from '../../../shared/formulaires/champ-formulaire/champ-formulaire';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';

@Component({
  selector: 'app-mot-de-passe-oublie',
  imports: [FormField, RouterLink, ChampFormulaire],
  templateUrl: './mot-de-passe-oublie.html',
  styleUrl: './mot-de-passe-oublie.scss'
})
export class MotDePasseOublie {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly modele = signal({ email: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.email, { message: "L'email est obligatoire" });
    email(champ.email, { message: 'Vérifiez l’adresse : elle doit ressembler à nom@exemple.com' });
  });
  protected readonly enChargement = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  // L'utilisateur a déjà essayé d'envoyer : les erreurs s'affichent même sans saisie
  private readonly tentee = signal(false);

  /** Erreur affichée après une saisie quittée ou un essai d'envoi, pas à l'arrivée sur la page. */
  protected readonly erreurEmail = computed(() => {
    const champ = this.formulaire.email();
    const montrer = (champ.touched() && champ.dirty()) || this.tentee();
    return montrer && champ.invalid() ? (champ.errors()[0]?.message ?? null) : null;
  });

  protected envoyerCode(): void {
    this.tentee.set(true);
    if (this.formulaire().invalid()) {
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
      return;
    }

    this.enChargement.set(true);
    this.messageErreur.set(null);
    const emailSaisi = this.modele().email.trim().toLowerCase();
    this.authService.demanderReinitialisation(emailSaisi).subscribe({
      next: () => {
        this.enChargement.set(false);
        this.router.navigate(['/reinitialiser-mot-de-passe'], {
          queryParams: { email: emailSaisi }
        });
      },
      error: (err: { error?: { message?: string } }) => {
        this.enChargement.set(false);
        this.messageErreur.set(err?.error?.message ?? "Impossible d'envoyer le code.");
      }
    });
  }
}
