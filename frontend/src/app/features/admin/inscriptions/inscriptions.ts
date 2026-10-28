import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { CriteresComptes, LIBELLES_ROLE_COMPTE, RoleCompte } from '../../../core/services/models/admin.model';
import { etatDepuis, parametresDepuis, ROLES_COMPTE } from '../criteres-url';
import { ListeComptes } from '../liste-comptes/liste-comptes';
import { PageAdmin } from '../page-admin/page-admin';

/** Inscriptions à examiner, dans l’ordre d’arrivée, filtrables par type de compte (GAEPT-3). */
@Component({
  selector: 'app-inscriptions',
  imports: [ListeComptes, PageAdmin],
  templateUrl: './inscriptions.html',
  styleUrl: './inscriptions.scss',
})
export class Inscriptions {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly compteur = inject(CompteurInscriptions);

  protected readonly etat = toSignal(this.route.queryParamMap.pipe(map((params) => etatDepuis(params, 'EN_ATTENTE'))), {
    initialValue: etatDepuis(this.route.snapshot.queryParamMap, 'EN_ATTENTE'),
  });
  protected readonly criteres = computed<CriteresComptes>(() => this.etat().criteres, {
    equal: (a, b) => a.role === b.role,
  });
  /** Un filtre par type de compte ayant des inscriptions en attente, plus « Tous ». */
  protected readonly filtres = computed(() => {
    const resume = this.compteur.resume();
    const parRole = resume?.enAttenteParRole ?? {};
    return [
      { valeur: null as RoleCompte | null, libelle: 'Tous', nombre: resume?.enAttente ?? null },
      ...ROLES_COMPTE
        .filter((role) => (parRole[role] ?? 0) > 0 || role === this.criteres().role)
        .map((role) => ({ valeur: role as RoleCompte | null, libelle: LIBELLES_ROLE_COMPTE[role], nombre: parRole[role] ?? 0 })),
    ];
  });

  protected choisirRole(role: RoleCompte | null): void {
    this.naviguer(role, 0, true);
  }

  protected allerPage(page: number): void {
    this.naviguer(this.criteres().role, page, false);
  }

  private naviguer(role: RoleCompte | null, page: number, remplacer: boolean): void {
    const queryParams = parametresDepuis({ criteres: { ...this.criteres(), role }, page }, true);
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: remplacer });
  }
}
