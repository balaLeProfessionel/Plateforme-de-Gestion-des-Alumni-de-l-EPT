import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Accord, PREAVIS_RESILIATION_MOIS } from '../../../core/services/models/partenariat.model';
import { AccordsService } from '../../../core/services/partenariats/accords';

type Confirmation = 'refus' | 'retrait' | 'resiliation' | null;

/**
 * Ce que la personne connectée peut faire d’un accord : y répondre si l’autre partie l’a proposé, le corriger ou le
 * retirer si elle l’a proposé, le résilier avec un préavis s’il est en vigueur ou à venir. Refus et résiliation
 * exigent un motif, communiqué à l’autre partie.
 */
@Component({
  selector: 'app-decision-accord',
  templateUrl: './decision-accord.html',
  styleUrl: './decision-accord.scss',
})
export class DecisionAccord {
  private readonly service = inject(AccordsService);

  readonly accord = input.required<Accord>();
  readonly admin = input(false);
  readonly modifie = output<{ accord: Accord; message: string }>();
  readonly corriger = output<void>();

  protected readonly confirmation = signal<Confirmation>(null);
  protected readonly motif = signal('');
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly preavis = PREAVIS_RESILIATION_MOIS;
  protected readonly resiliable = computed(() => this.accord().resiliable);
  protected readonly visible = computed(() => this.accord().aRepondre || this.accord().modifiable || this.resiliable());

  protected ouvrir(confirmation: Confirmation): void {
    this.motif.set('');
    this.erreur.set(null);
    this.confirmation.set(confirmation);
  }

  protected saisirMotif(evenement: Event): void {
    this.motif.set((evenement.target as HTMLTextAreaElement).value);
  }

  protected accepter(): void {
    this.executer(this.service.accepter(this.accord().id, this.admin()), 'L’accord est accepté ; l’autre partie en est prévenue.');
  }

  protected confirmer(): void {
    const id = this.accord().id;
    const motif = this.motif().trim();
    switch (this.confirmation()) {
      case 'retrait':
        this.executer(this.service.retirer(id, this.admin()), 'La proposition est retirée.');
        return;
      case 'refus':
        if (!motif) { this.erreur.set('Le motif est obligatoire : il est communiqué à l’autre partie.'); return; }
        this.executer(this.service.refuser(id, motif, this.admin()), 'L’accord est refusé ; l’autre partie reçoit le motif.');
        return;
      case 'resiliation':
        if (!motif) { this.erreur.set('Le motif est obligatoire : il est communiqué à l’autre partie.'); return; }
        this.executer(this.service.resilier(id, motif, this.admin()),
          `La résiliation est signalée ; l’autre partie est prévenue. L’accord reste en vigueur pendant le préavis de ${this.preavis} mois.`);
        return;
    }
  }

  private executer(requete: Observable<Accord>, message: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (accord) => {
        this.enCours.set(false);
        this.confirmation.set(null);
        this.modifie.emit({ accord, message });
      },
      error: (e: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(e.error?.message ?? 'L’action a échoué. Réessayez.');
      },
    });
  }
}
