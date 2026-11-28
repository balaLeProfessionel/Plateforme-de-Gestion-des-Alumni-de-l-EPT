import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import {
  LIBELLES_MOTIF_SIGNALEMENT, LIBELLES_STATUT_OFFRE_EMPLOI, LIBELLES_TYPE_CONTRAT, LONGUEUR_MOTIF_DECISION, OffreAModerer,
} from '../../../../core/services/models/offre-emploi.model';
import { ModerationOffresEmploiService } from '../../../../core/services/offres-emploi/moderation-offres-emploi';

type Decision = 'refuser' | 'retirer';

/**
 * Une offre d’emploi vue par l’administration (#224) : publier ou refuser une offre en attente, retirer une offre
 * publiée, classer ses signalements. Le motif d’un refus ou d’un retrait est envoyé à l’auteur.
 */
@Component({
  selector: 'app-carte-offre-a-moderer',
  imports: [DatePipe, RouterLink, FormField],
  templateUrl: './carte-offre-a-moderer.html',
  styleUrls: ['../../formulaire-admin.scss', './carte-offre-a-moderer.scss'],
})
export class CarteOffreAModerer {
  private readonly service = inject(ModerationOffresEmploiService);

  readonly element = input.required<OffreAModerer>();
  /** Message de la décision prise, pour la page qui recharge sa file. */
  readonly traitee = output<string>();

  protected readonly types = LIBELLES_TYPE_CONTRAT;
  protected readonly statuts = LIBELLES_STATUT_OFFRE_EMPLOI;
  protected readonly motifsSignalement = LIBELLES_MOTIF_SIGNALEMENT;
  protected readonly decision = signal<Decision | null>(null);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly auteur = computed(() => {
    const o = this.element().offre;
    const nom = [o.auteur.prenom, o.auteur.nom].filter(Boolean).join(' ');
    return o.mode === 'GEREE' ? `Publiée par ${o.entreprise}` : `Relayée par ${nom}`;
  });

  protected readonly modele = signal({ motif: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.motif, { message: 'Le motif est obligatoire : il est envoyé à l’auteur de l’offre.' });
    maxLength(champ.motif, LONGUEUR_MOTIF_DECISION, { message: `${LONGUEUR_MOTIF_DECISION} caractères au maximum.` });
  });

  protected ouvrir(decision: Decision): void {
    this.erreur.set(null);
    this.modele.set({ motif: '' });
    this.formulaire().reset();
    this.decision.set(decision);
  }

  protected publier(): void {
    this.executer(this.service.publier(this.element().offre.id),
      `« ${this.element().offre.titre} » est publiée. Son auteur est prévenu par notification et par e-mail.`);
  }

  protected classer(): void {
    this.executer(this.service.classerSignalements(this.element().offre.id),
      `Les signalements de « ${this.element().offre.titre} » sont classés : l’offre reste publiée.`);
  }

  protected async confirmer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    const decision = this.decision();
    if (!decision) return;
    const o = this.element().offre;
    await submit(this.formulaire, {
      action: async () => {
        const motif = this.modele().motif.trim();
        const requete = decision === 'refuser' ? this.service.refuser(o.id, motif) : this.service.retirer(o.id, motif);
        await this.executerAsync(requete, decision === 'refuser'
          ? `« ${o.titre} » est refusée. Son auteur reçoit le motif par notification et par e-mail.`
          : `« ${o.titre} » est retirée. Son auteur reçoit le motif${o.mode === 'GEREE'
            ? ', et les candidats encore en attente sont prévenus' : ''}.`);
        return undefined;
      },
    });
  }

  private executer(requete: Observable<OffreAModerer>, message: string): void {
    void this.executerAsync(requete, message);
  }

  private async executerAsync(requete: Observable<OffreAModerer>, message: string): Promise<void> {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    try {
      await firstValueFrom(requete);
      this.decision.set(null);
      this.traitee.emit(message);
    } catch (erreur) {
      this.erreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
        ? erreur.error.message : 'L’action a échoué. Réessayez.');
    } finally {
      this.enCours.set(false);
    }
  }
}
