import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import {
  FicheCompte, LIBELLES_DIPLOME, LIBELLES_ROLE_COMPTE, LIBELLES_STATUT_COMPTE, lienFicheCompte, nomDuCompte,
} from '../../../core/services/models/admin.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { DecisionsCompte } from '../decisions-compte/decisions-compte';
import { EvolutionCompte } from '../evolution-compte/evolution-compte';
import { HistoriqueCompte } from '../historique-compte/historique-compte';
import { PageAdmin } from '../page-admin/page-admin';

/**
 * Fiche complète d’un compte pour l’administration : champs privés compris, décisions et historique.
 * Ici la validation part tout de suite : on la décide après avoir lu la fiche.
 */
@Component({
  selector: 'app-fiche-compte',
  imports: [DatePipe, RouterLink, AvatarMembre, DecisionsCompte, EvolutionCompte, HistoriqueCompte, PageAdmin],
  templateUrl: './fiche-compte.html',
  styleUrls: ['../etats-admin.scss', './fiche-compte.scss'],
})
export class FicheComptePage {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(AdminComptesService);
  private readonly compteur = inject(CompteurInscriptions);

  protected readonly libellesRole = LIBELLES_ROLE_COMPTE;
  protected readonly libellesStatut = LIBELLES_STATUT_COMPTE;
  protected readonly libellesDiplome = LIBELLES_DIPLOME;
  protected readonly parents = [{ libelle: 'Comptes', lien: '/admin/comptes' }];

  private readonly id = toSignal(this.route.paramMap.pipe(map((params) => params.get('id') ?? '')), {
    initialValue: this.route.snapshot.paramMap.get('id') ?? '',
  });
  /** Incrémentée après chaque décision : la fiche et son historique se rechargent. */
  protected readonly version = signal(0);
  protected readonly fiche = signal<FicheCompte | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly annonce = signal<{ texte: string; erreur?: boolean } | null>(null);
  protected readonly enValidation = signal(false);
  protected readonly nomComplet = computed(() => {
    const compte = this.fiche()?.compte;
    return compte ? nomDuCompte(compte) : 'Fiche du compte';
  });
  /** L’adresse se coupe avant l’arobase plutôt qu’au milieu d’un mot. */
  protected readonly partiesEmail = computed(() => {
    const email = this.fiche()?.compte.email ?? '';
    const arobase = email.indexOf('@');
    return arobase < 0 ? { local: email, domaine: '' } : { local: email.slice(0, arobase), domaine: email.slice(arobase) };
  });
  protected readonly lienPublic = computed(() => {
    const fiche = this.fiche();
    return fiche ? lienFicheCompte(fiche.compte) : null;
  });

  constructor() {
    toObservable(computed(() => ({ id: this.id(), version: this.version() }))).pipe(
      switchMap(({ id }) => this.service.fiche(id).pipe(
        map((fiche) => ({ fiche, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          fiche: null,
          erreur: erreur.status === 404 ? 'Ce compte n’existe pas ou n’a pas encore vérifié son adresse e-mail.'
            : erreur.error?.message ?? 'Impossible de charger la fiche.',
        })))),
      takeUntilDestroyed()
    ).subscribe(({ fiche, erreur }) => {
      this.fiche.set(fiche);
      this.erreur.set(erreur);
    });
  }

  protected valider(): void {
    const fiche = this.fiche();
    if (!fiche || this.enValidation()) return;
    this.enValidation.set(true);
    this.service.valider(fiche.compte.id).subscribe({
      next: () => {
        this.enValidation.set(false);
        this.apresDecision(`Inscription de ${this.nomComplet()} validée.`);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enValidation.set(false);
        this.annonce.set({ texte: erreur.error?.message ?? 'La validation n’a pas abouti. Réessayez.', erreur: true });
      },
    });
  }

  protected apresDecision(message: string): void {
    this.annonce.set({ texte: message });
    this.compteur.actualiser();
    this.version.update((version) => version + 1);
  }
}
