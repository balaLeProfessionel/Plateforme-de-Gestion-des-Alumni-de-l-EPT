import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { AuthService } from '../../../core/services/auth/auth-service';
import { LIBELLES_ACTION_ADMIN, TableauDeBordAdmin } from '../../../core/services/models/admin.model';
import { PageAdmin } from '../page-admin/page-admin';

const JOUR_MS = 86_400_000;

/** Accueil de l’administration : ce qui attend une décision, l’état de la communauté, les dernières décisions. */
@Component({
  selector: 'app-tableau-de-bord',
  imports: [DatePipe, RouterLink, PageAdmin],
  templateUrl: './tableau-de-bord.html',
  styleUrls: ['../etats-admin.scss', './tableau-de-bord.scss'],
})
export class TableauDeBord {
  protected readonly libellesAction = LIBELLES_ACTION_ADMIN;
  /** L’alerte « un seul super administrateur » ne sert qu’à qui peut en nommer un autre. */
  private readonly authService = inject(AuthService);
  protected readonly superAdministrateur = computed(() => this.authService.aPermission('GERER_ADMINISTRATEURS'));
  /** La file des offres d’emploi ne mène nulle part sans la responsabilité correspondante. */
  protected readonly moderateurOffres = computed(() => this.authService.aPermission('GERER_OFFRES_EMPLOI'));
  protected readonly tableau = signal<TableauDeBordAdmin | null>(null);
  protected readonly erreur = signal<string | null>(null);
  /** Ancienneté de l’inscription la plus ancienne, en jours entiers. */
  protected readonly joursAttente = computed(() => {
    const date = this.tableau()?.aTraiter.plusAncienneInscription;
    return date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / JOUR_MS)) : null;
  });

  constructor() {
    inject(AdminComptesService).tableauDeBord().subscribe({
      next: (tableau) => this.tableau.set(tableau),
      error: (erreur: HttpErrorResponse) =>
        this.erreur.set(erreur.error?.message ?? 'Impossible de charger le tableau de bord.'),
    });
  }
}
