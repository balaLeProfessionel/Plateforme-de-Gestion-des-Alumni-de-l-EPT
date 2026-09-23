import { DatePipe, DOCUMENT, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { OrganismePublic } from '../../../core/services/models/organisme.model';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';

@Component({
  selector: 'app-consultation-organisme',
  imports: [DatePipe],
  templateUrl: './consultation-organisme.html',
  styleUrl: './consultation-organisme.scss',
})
export class ConsultationOrganisme {
  private readonly organismeService = inject(OrganismeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actualiserSujet = new Subject<void>();

  protected readonly organisme = signal<OrganismePublic | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly imageInvalide = signal(false);

  protected readonly initiales = computed(() =>
    this.organisme()?.nom.trim().slice(0, 2).toUpperCase() || 'OR'
  );

  protected readonly typeOrganisme = computed(() => {
    const type = this.organisme()?.typeOrganisme;
    return ({
      ENTREPRISE: 'Entreprise',
      ETABLISSEMENT_ENSEIGNEMENT: 'Établissement d’enseignement',
      INSTITUTION_PUBLIQUE: 'Institution publique',
      ONG: 'ONG',
      AUTRE: 'Organisme'
    } as Record<string, string>)[type ?? ''] ?? 'Organisme';
  });

  protected readonly siteWebValide = computed(() => {
    const siteWeb = this.organisme()?.siteWeb;
    if (!siteWeb) {
      return null;
    }
    try {
      const url = new URL(siteWeb);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  });

  constructor() {
    combineLatest([
      this.route.paramMap,
      this.actualiserSujet.pipe(startWith(undefined))
    ]).pipe(
      tap(() => {
        this.enChargement.set(true);
        this.messageErreur.set(null);
        this.imageInvalide.set(false);
      }),
      switchMap(([params]) => this.organismeService.obtenirProfilPublic(params.get('id') ?? '').pipe(
        map((organisme) => ({ organisme, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          organisme: null,
          erreur: erreur.status === 404
            ? "Cet organisme n'est pas disponible."
            : "Impossible de charger l'organisme."
        }))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ organisme, erreur }) => {
      this.organisme.set(organisme);
      this.messageErreur.set(erreur);
      this.enChargement.set(false);
    });
  }

  protected actualiser(): void {
    this.actualiserSujet.next();
  }

  protected retourner(): void {
    if ((this.document.defaultView?.history.length ?? 0) > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/annuaire');
  }
}
