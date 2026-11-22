import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, map, merge, of, Subject, switchMap } from 'rxjs';
import { FilieresService } from '../../../core/services/filieres/filieres';
import { FiltresSuivi, OrganismeSuivi } from '../../../core/services/models/stage.model';
import { SuiviStagesService } from '../../../core/services/stages/suivi-stages';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { PageAdmin } from '../page-admin/page-admin';
import { filtresDepuis, parametresFiltres } from './filtres-suivi';

/**
 * Suivi des stages confirmés (STA-08), premier niveau : les organismes d’accueil, avec ce qui reste à faire chez
 * chacun. Un organisme ouvre la liste de ses stagiaires (SuiviOrganismePage). Les filtres sont gardés dans l’URL.
 */
@Component({
  selector: 'app-suivi-stages',
  imports: [RouterLink, PageAdmin, AvatarMembre],
  templateUrl: './suivi-stages.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', './suivi-stages.scss'],
})
export class SuiviStagesPage {
  private readonly service = inject(SuiviStagesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly parents = [{ libelle: 'Stages', lien: '/stages' }];
  protected readonly filieres = inject(FilieresService).proposees();
  protected readonly criteres = signal<FiltresSuivi>(filtresDepuis(this.route.snapshot.queryParamMap));
  protected readonly organismes = signal<OrganismeSuivi[] | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  private readonly immediat = new Subject<void>();
  private readonly differe = new Subject<void>();

  constructor() {
    merge(this.immediat, this.differe.pipe(debounceTime(300))).pipe(
      map(() => this.criteres()),
      switchMap((c) => {
        this.router.navigate([], { queryParams: parametresFiltres(c), replaceUrl: true });
        return this.service.organismes(c).pipe(catchError((erreur: HttpErrorResponse) => {
          this.erreurChargement.set(erreur.error?.message ?? 'Impossible de charger les stages.');
          return of(null);
        }));
      }),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((liste) => {
      if (liste) this.erreurChargement.set(null);
      this.organismes.set(liste);
    });
    this.immediat.next();
  }

  /** Paramètres du lien vers un organisme : son identifiant (ou son nom proposé) et les filtres en cours. */
  protected lien(o: OrganismeSuivi): Record<string, string> {
    return { ...parametresFiltres(this.criteres()), ...(o.organismeId ? { organisme: o.organismeId } : { nom: o.nom }) };
  }

  protected totalStagiaires(liste: readonly OrganismeSuivi[]): number {
    return liste.reduce((total, o) => total + o.stagiaires, 0);
  }

  protected saisirTexte(evenement: Event): void {
    this.criteres.update((c) => ({ ...c, texte: (evenement.target as HTMLInputElement).value }));
    this.differe.next();
  }

  protected choisirFiliere(evenement: Event): void {
    this.criteres.update((c) => ({ ...c, filiere: (evenement.target as HTMLSelectElement).value }));
    this.immediat.next();
  }

  protected basculerSansEncadrant(evenement: Event): void {
    this.criteres.update((c) => ({ ...c, sansEncadrant: (evenement.target as HTMLInputElement).checked }));
    this.immediat.next();
  }
}
