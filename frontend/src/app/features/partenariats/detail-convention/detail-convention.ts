import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Convention, HistoriqueConvention, STATUTS_EN_COURS } from '../../../core/services/models/partenariat.model';
import { ConventionsPartenariatService } from '../../../core/services/partenariats/conventions-partenariat';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { FormulaireDemandeConvention } from '../formulaire-demande-convention/formulaire-demande-convention';
import { HistoriqueConventionListe } from '../historique-convention/historique-convention';
import { InfosConvention } from '../infos-convention/infos-convention';
import { PiecesConvention } from '../pieces-convention/pieces-convention';

/**
 * Une convention vue par son organisme : avancement, documents, historique. La demande se corrige tant que l’école ne
 * l’a pas prise en examen, et s’annule tant qu’elle n’est pas conclue.
 */
@Component({
  selector: 'app-detail-convention',
  imports: [FilAriane, InfosConvention, PiecesConvention, HistoriqueConventionListe, FormulaireDemandeConvention],
  templateUrl: './detail-convention.html',
  styleUrl: './detail-convention.scss',
})
export class DetailConvention implements OnInit {
  private readonly service = inject(ConventionsPartenariatService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly convention = signal<Convention | null>(null);
  protected readonly historique = signal<HistoriqueConvention[]>([]);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly message = signal<string | null>((inject(Router).getCurrentNavigation()?.extras.state?.['message'] as string | undefined) ?? null);
  protected readonly edition = signal(false);
  protected readonly confirmationAnnulation = signal(false);
  protected readonly enCours = signal(false);
  protected readonly erreurAction = signal<string | null>(null);

  protected readonly etapes = computed(() => [
    { libelle: 'Partenariat avec l’EPT', lien: '/partenariats' }, { libelle: this.convention()?.objet ?? 'Convention' },
  ]);
  protected readonly enTraitement = computed(() => {
    const c = this.convention();
    return !!c && STATUTS_EN_COURS.includes(c.statut);
  });
  protected readonly annulable = computed(() => this.enTraitement() && this.convention()?.origine === 'ORGANISME');

  ngOnInit(): void {
    this.service.detail(this.id, false).subscribe({
      next: (c) => this.convention.set(c),
      error: (e: HttpErrorResponse) => this.erreurChargement.set(e.status === 404 ? 'Cette convention n’existe pas.' : 'Impossible de charger la convention.'),
    });
    this.chargerHistorique();
  }

  protected miseAJour(convention: Convention, message: string | null = null): void {
    this.convention.set(convention);
    this.edition.set(false);
    if (message) this.message.set(message);
    this.chargerHistorique();
  }

  protected annuler(): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreurAction.set(null);
    this.service.annuler(this.id).subscribe({
      next: (c) => {
        this.enCours.set(false);
        this.confirmationAnnulation.set(false);
        this.miseAJour(c, 'Votre demande est annulée. Vous pouvez en déposer une nouvelle.');
      },
      error: (e: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreurAction.set(e.error?.message ?? 'L’annulation a échoué. Réessayez.');
      },
    });
  }

  private chargerHistorique(): void {
    this.service.historique(this.id, false).subscribe({ next: (h) => this.historique.set(h), error: () => this.historique.set([]) });
  }
}
