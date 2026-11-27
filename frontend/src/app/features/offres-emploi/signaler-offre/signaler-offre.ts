import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { MOTIFS_SIGNALEMENT, MotifSignalementOffre } from '../../../core/services/models/offre-emploi.model';
import { OffresEmploiService } from '../../../core/services/offres-emploi/offres-emploi';

/** Signaler une offre (lien mort, arnaque…) : un panneau qui s’ouvre sous l’offre, une seule fois par membre. */
@Component({
  selector: 'app-signaler-offre',
  imports: [FormField],
  template: `
    <section class="signalement" aria-labelledby="titre-signalement">
      @if (envoye()) {
        <p class="confirme" role="status"><i class="pi pi-check" aria-hidden="true"></i>Merci, l’école examinera votre signalement.</p>
      } @else if (ouvert()) {
        <form (submit)="envoyer($event)" novalidate>
          <h2 id="titre-signalement">Signaler cette offre</h2>
          <div class="champ">
            <label for="signalement-motif">Raison</label>
            <select id="signalement-motif" [formField]="formulaire.motif"
              [attr.aria-invalid]="formulaire.motif().touched() && formulaire.motif().invalid()" aria-describedby="erreur-motif">
              <option value="">Choisir…</option>
              @for (motif of motifs; track motif.valeur) { <option [value]="motif.valeur">{{ motif.libelle }}</option> }
            </select>
            @if (formulaire.motif().touched() && formulaire.motif().errors()[0]; as erreur) {
              <small id="erreur-motif" class="erreur-champ">{{ erreur.message }}</small>
            }
          </div>
          <div class="champ">
            <label for="signalement-commentaire">Précisions (facultatif)</label>
            <textarea id="signalement-commentaire" rows="2" [formField]="formulaire.commentaire" aria-describedby="erreur-commentaire"></textarea>
            @if (formulaire.commentaire().errors()[0]; as erreur) {
              <small id="erreur-commentaire" class="erreur-champ">{{ erreur.message }}</small>
            }
          </div>
          @if (erreur(); as message) { <p class="message-erreur" role="alert">{{ message }}</p> }
          <div class="boutons">
            <button type="submit" class="bouton principal" [disabled]="formulaire().submitting()">Envoyer le signalement</button>
            <button type="button" class="bouton" (click)="ouvert.set(false)">Annuler</button>
          </div>
        </form>
      } @else {
        <h2 id="titre-signalement" class="sr-only">Signaler cette offre</h2>
        <button type="button" class="lien" (click)="ouvert.set(true)"><i class="pi pi-flag" aria-hidden="true"></i>Signaler un problème avec cette offre</button>
      }
    </section>
  `,
  styleUrl: './signaler-offre.scss',
})
export class SignalerOffre {
  private readonly service = inject(OffresEmploiService);

  readonly offreId = input.required<string>();
  readonly signalee = output<void>();

  protected readonly motifs = MOTIFS_SIGNALEMENT;
  protected readonly ouvert = signal(false);
  protected readonly envoye = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly modele = signal({ motif: '' as MotifSignalementOffre | '', commentaire: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.motif, { message: 'Choisissez une raison.' });
    maxLength(champ.commentaire, 500, { message: '500 caractères au maximum.' });
  });

  protected async envoyer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    this.erreur.set(null);
    await submit(this.formulaire, async () => {
      const { motif, commentaire } = this.modele();
      try {
        await firstValueFrom(this.service.signaler(this.offreId(), motif as MotifSignalementOffre, commentaire.trim()));
        this.envoye.set(true);
        this.signalee.emit();
      } catch (erreur) {
        this.erreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
          ? erreur.error.message : 'Le signalement n’a pas pu être envoyé. Réessayez.');
      }
      return undefined;
    });
  }
}
