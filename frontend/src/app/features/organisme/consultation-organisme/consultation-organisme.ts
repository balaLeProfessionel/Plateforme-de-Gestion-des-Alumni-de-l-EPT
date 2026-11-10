import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { AuthService } from '../../../core/services/auth/auth-service';
import { OrganismePublic, ResumeReseauOrganisme } from '../../../core/services/models/organisme.model';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { EnteteOrganisme } from '../entete-organisme/entete-organisme';
import { EvenementsOrganisme } from '../evenements-organisme/evenements-organisme';
import { MembresOrganisme } from '../membres-organisme/membres-organisme';

@Component({
  selector: 'app-consultation-organisme',
  imports: [DatePipe, BoutonRetour, EnteteOrganisme, MembresOrganisme, EvenementsOrganisme],
  templateUrl: './consultation-organisme.html',
  styleUrl: './consultation-organisme.scss',
})
export class ConsultationOrganisme {
  private readonly organismeService = inject(OrganismeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actualiserSujet = new Subject<void>();

  protected readonly organisme = signal<OrganismePublic | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly reseau = signal<ResumeReseauOrganisme | null>(null);
  /** Identifiant de l'organisme du compte connecté, s'il s'agit d'un compte organisme. */
  private readonly monOrganismeId = signal<string | null>(null);
  protected readonly estMaFiche = computed(() =>
    this.monOrganismeId() !== null && this.monOrganismeId() === this.organisme()?.id);

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

  /** Adresse lisible du site : sans protocole ni barre finale. */
  protected readonly siteWebAffiche = computed(() =>
    this.siteWebValide()?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? '');

  constructor() {
    if (inject(AuthService).utilisateur()?.role === 'ORGANISME') {
      this.organismeService.obtenirMonProfil().pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: (moi) => this.monOrganismeId.set(moi.id), error: () => undefined });
    }
    combineLatest([
      this.route.paramMap,
      this.actualiserSujet.pipe(startWith(undefined))
    ]).pipe(
      tap(() => {
        this.reseau.set(null);
        this.enChargement.set(true);
        this.messageErreur.set(null);
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

}
