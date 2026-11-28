import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, Injector, signal } from '@angular/core';
import { form, FormField, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { AuthService } from '../../../core/services/auth/auth-service';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { SectionGoogle } from '../../auth/section-google/section-google';
import { PageAdmin } from '../page-admin/page-admin';

type Message = { texte: string; erreur?: boolean };

/** Compte de l’administrateur connecté : il n’a pas de profil de membre, son nom et son mot de passe se changent ici. */
@Component({
  selector: 'app-mon-compte',
  imports: [FormField, PageAdmin, SectionGoogle],
  templateUrl: './mon-compte.html',
  styleUrls: ['../formulaire-admin.scss', './mon-compte.scss'],
})
export class MonCompte {
  private readonly service = inject(AdminComptesService);
  protected readonly authService = inject(AuthService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly modeleIdentite = signal({
    prenom: this.authService.utilisateur()?.prenom ?? '',
    nom: this.authService.utilisateur()?.nom ?? '',
  });
  protected readonly formulaireIdentite = form(this.modeleIdentite, (champ) => {
    required(champ.prenom, { message: 'Le prénom est obligatoire.' });
    maxLength(champ.prenom, 100, { message: '100 caractères au maximum.' });
    required(champ.nom, { message: 'Le nom est obligatoire.' });
    maxLength(champ.nom, 100, { message: '100 caractères au maximum.' });
  });
  protected readonly envoiIdentite = signal(false);
  protected readonly messageIdentite = signal<Message | null>(null);

  protected readonly modeleMotDePasse = signal({ actuel: '', nouveau: '', confirmation: '' });
  protected readonly formulaireMotDePasse = form(this.modeleMotDePasse, (champ) => {
    required(champ.actuel, { message: 'Saisissez votre mot de passe actuel.' });
    required(champ.nouveau, { message: 'Choisissez un nouveau mot de passe.' });
    minLength(champ.nouveau, 8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' });
    validate(champ.nouveau, ({ value, valueOf }) => value() && value() === valueOf(champ.actuel)
      ? { kind: 'identique', message: 'Choisissez un mot de passe différent de l’actuel.' } : undefined);
    required(champ.confirmation, { message: 'Saisissez à nouveau le nouveau mot de passe.' });
    validate(champ.confirmation, ({ value, valueOf }) => value() && value() !== valueOf(champ.nouveau)
      ? { kind: 'differents', message: 'Les deux mots de passe ne correspondent pas.' } : undefined);
  });
  /** La règle n’apparaît que pendant la saisie d’un mot de passe trop court, et pas en plus de l’erreur. */
  protected readonly regleVisible = computed(() => {
    const longueur = this.modeleMotDePasse().nouveau.length;
    const champ = this.formulaireMotDePasse.nouveau();
    return longueur > 0 && longueur < 8 && !(champ.touched() && champ.invalid());
  });
  protected readonly envoiMotDePasse = signal(false);
  protected readonly messageMotDePasse = signal<Message | null>(null);

  protected enregistrerIdentite(evenement: Event): void {
    evenement.preventDefault();
    this.formulaireIdentite().markAsTouched();
    if (this.formulaireIdentite().invalid()) {
      focaliserPremiereErreur(this.hote.nativeElement.querySelector('#form-identite') ?? this.hote.nativeElement, this.injector);
      return;
    }
    const { prenom, nom } = this.modeleIdentite();
    this.envoiIdentite.set(true);
    this.messageIdentite.set(null);
    this.service.modifierMonIdentite(prenom.trim(), nom.trim()).subscribe({
      next: () => {
        this.envoiIdentite.set(false);
        this.authService.resynchroniser();
        this.messageIdentite.set({ texte: 'Nom enregistré.' });
      },
      error: (erreur: HttpErrorResponse) => {
        this.envoiIdentite.set(false);
        this.messageIdentite.set({ texte: erreur.error?.message ?? 'Le nom n’a pas pu être enregistré. Réessayez.', erreur: true });
      },
    });
  }

  protected changerMotDePasse(evenement: Event): void {
    evenement.preventDefault();
    this.formulaireMotDePasse().markAsTouched();
    if (this.formulaireMotDePasse().invalid()) {
      focaliserPremiereErreur(this.hote.nativeElement.querySelector('#form-mot-de-passe') ?? this.hote.nativeElement, this.injector);
      return;
    }
    const { actuel, nouveau } = this.modeleMotDePasse();
    this.envoiMotDePasse.set(true);
    this.messageMotDePasse.set(null);
    this.authService.changerMotDePasse(actuel, nouveau).subscribe({
      next: () => {
        this.envoiMotDePasse.set(false);
        this.modeleMotDePasse.set({ actuel: '', nouveau: '', confirmation: '' });
        this.formulaireMotDePasse().reset();
        this.messageMotDePasse.set({ texte: 'Mot de passe modifié. Vos autres sessions ont été déconnectées.' });
      },
      error: (erreur: HttpErrorResponse) => {
        this.envoiMotDePasse.set(false);
        this.messageMotDePasse.set({
          texte: erreur.status === 401 ? 'Le mot de passe actuel est incorrect.'
            : erreur.error?.message ?? 'Le mot de passe n’a pas pu être modifié. Réessayez.',
          erreur: true,
        });
      },
    });
  }
}
