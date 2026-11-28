import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Convention, PREAVIS_RESILIATION_MOIS } from '../../../core/services/models/partenariat.model';
import { ConventionsPartenariatService } from '../../../core/services/partenariats/conventions-partenariat';

/**
 * Résiliation d’une convention active, par l’organisme ou par l’école (`admin`) : motif obligatoire, effet après le
 * préavis. La partie qui l’a signalée peut y renoncer avant la date d’effet.
 */
@Component({
  selector: 'app-resiliation-convention',
  imports: [DatePipe],
  templateUrl: './resiliation-convention.html',
  styleUrl: '../decision-accord/decision-accord.scss',
})
export class ResiliationConvention {
  private readonly service = inject(ConventionsPartenariatService);

  readonly convention = input.required<Convention>();
  readonly admin = input(false);
  readonly modifiee = output<{ convention: Convention; message: string }>();

  protected readonly preavis = PREAVIS_RESILIATION_MOIS;
  protected readonly ouverte = signal(false);
  protected readonly motif = signal('');
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly visible = computed(() => this.convention().resiliable || this.convention().resiliationAnnulable);

  protected ouvrir(): void {
    this.motif.set('');
    this.erreur.set(null);
    this.ouverte.set(true);
  }

  protected saisirMotif(evenement: Event): void {
    this.motif.set((evenement.target as HTMLTextAreaElement).value);
  }

  protected signaler(): void {
    const motif = this.motif().trim();
    if (!motif) {
      this.erreur.set('Le motif est obligatoire : il est communiqué à l’autre partie.');
      return;
    }
    this.executer(this.service.resilier(this.convention().id, motif, this.admin()),
      `La résiliation est signalée ; l’autre partie est prévenue. La convention reste active pendant le préavis de ${this.preavis} mois.`);
  }

  protected annuler(): void {
    this.executer(this.service.annulerResiliation(this.convention().id, this.admin()), 'La résiliation est annulée : la convention continue.');
  }

  private executer(requete: Observable<Convention>, message: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (convention) => {
        this.enCours.set(false);
        this.ouverte.set(false);
        this.modifiee.emit({ convention, message });
      },
      error: (e: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(e.error?.message ?? 'L’action a échoué. Réessayez.');
      },
    });
  }
}
