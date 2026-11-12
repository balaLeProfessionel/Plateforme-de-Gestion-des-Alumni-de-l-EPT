import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Page } from '../../../core/services/models/mentorat.model';
import {
  DestinataireSollicitation, LIBELLES_SOLLICITATION, LONGUEUR_MESSAGE_SOLLICITATION, LONGUEUR_OBJET_SOLLICITATION,
  Sollicitation, TypeSollicitation,
} from '../../../core/services/models/stage.model';
import { SollicitationsService } from '../../../core/services/stages/sollicitations';
import { PageAdmin } from '../page-admin/page-admin';
import { PaginationAdmin } from '../pagination-admin/pagination-admin';

/**
 * Sollicitation des organismes (STA-11) : l’administrateur Stages choisit la campagne, relit le message prérempli,
 * retire des destinataires s’il le veut, envoie, puis retrouve l’envoi dans l’historique.
 */
@Component({
  selector: 'app-sollicitations',
  imports: [DatePipe, PageAdmin, PaginationAdmin],
  templateUrl: './sollicitations.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', './sollicitations.scss'],
})
export class SollicitationsPage {
  private readonly service = inject(SollicitationsService);

  protected readonly parents = [{ libelle: 'Stages', lien: '/stages' }];
  protected readonly types = Object.entries(LIBELLES_SOLLICITATION) as [TypeSollicitation, string][];
  protected readonly libelles = LIBELLES_SOLLICITATION;
  protected readonly longueurObjet = LONGUEUR_OBJET_SOLLICITATION;
  protected readonly longueurMessage = LONGUEUR_MESSAGE_SOLLICITATION;

  protected readonly type = signal<TypeSollicitation>(new Date().getMonth() >= 6 ? 'SUJETS_PFE' : 'OFFRES_STAGE');
  protected readonly objet = signal('');
  protected readonly message = signal('');
  protected readonly destinataires = signal<DestinataireSollicitation[] | null>(null);
  protected readonly retires = signal<ReadonlySet<string>>(new Set());
  protected readonly choisis = computed(() => (this.destinataires() ?? []).filter((d) => !this.retires().has(d.organismeId)));
  protected readonly confirmation = signal(false);
  protected readonly enCours = signal(false);
  protected readonly annonce = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly historique = signal<Page<Sollicitation> | null>(null);
  protected readonly ouverte = signal<Sollicitation | null>(null);

  constructor() {
    this.service.destinataires().subscribe({
      next: (liste) => this.destinataires.set(liste),
      error: () => this.erreurChargement.set('Impossible de charger les organismes à solliciter.'),
    });
    this.chargerModele();
    this.chargerHistorique(0);
  }

  protected choisirType(type: TypeSollicitation): void {
    this.type.set(type);
    this.chargerModele();
  }

  protected saisir(champ: 'objet' | 'message', evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement | HTMLTextAreaElement).value;
    (champ === 'objet' ? this.objet : this.message).set(valeur);
  }

  protected basculer(id: string, evenement: Event): void {
    const coche = (evenement.target as HTMLInputElement).checked;
    this.retires.update((r) => {
      const suivant = new Set(r);
      if (coche) suivant.delete(id); else suivant.add(id);
      return suivant;
    });
  }

  protected toutCocher(coche: boolean): void {
    this.retires.set(coche ? new Set() : new Set((this.destinataires() ?? []).map((d) => d.organismeId)));
  }

  protected demanderEnvoi(): void {
    this.annonce.set(null);
    if (!this.objet().trim() || !this.message().trim()) {
      this.erreur.set('L’objet et le message sont obligatoires.');
      return;
    }
    if (this.choisis().length === 0) {
      this.erreur.set('Choisissez au moins un organisme.');
      return;
    }
    this.erreur.set(null);
    this.confirmation.set(true);
  }

  protected envoyer(): void {
    this.confirmation.set(false);
    this.enCours.set(true);
    this.service.envoyer({ type: this.type(), objet: this.objet(), message: this.message(), organismeIds: this.choisis().map((d) => d.organismeId) })
      .subscribe({
        next: (envoyee) => {
          this.enCours.set(false);
          this.annonce.set(`Message envoyé à ${envoyee.nombreDestinataires} organisme${envoyee.nombreDestinataires > 1 ? 's' : ''}.`);
          this.chargerHistorique(0);
        },
        error: (erreur: HttpErrorResponse) => {
          this.enCours.set(false);
          this.erreur.set(erreur.error?.message ?? erreur.error?.organismeIds ?? 'L’envoi n’a pas abouti. Réessayez.');
        },
      });
  }

  protected chargerHistorique(page: number): void {
    this.service.historique(page).subscribe({ next: (p) => this.historique.set(p), error: () => this.historique.set(null) });
  }

  protected basculerDetail(s: Sollicitation): void {
    if (this.ouverte()?.id === s.id) {
      this.ouverte.set(null);
      return;
    }
    this.service.detail(s.id).subscribe((detail) => this.ouverte.set(detail));
  }

  private chargerModele(): void {
    this.service.modele(this.type()).subscribe(({ objet, message }) => {
      this.objet.set(objet);
      this.message.set(message);
    });
  }
}
