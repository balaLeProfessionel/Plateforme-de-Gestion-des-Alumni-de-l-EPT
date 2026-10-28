import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, firstValueFrom, map, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { AuthService } from '../../../core/services/auth/auth-service';
import { Evenement, PageParticipants, ReponseParticipation } from '../../../core/services/models/evenement';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { VisuelEvenement } from '../../../shared/images/visuel-evenement';
import { etatNavigationEvenement, urlRetourInterne } from '../navigation-evenements';

@Component({
  selector: 'app-detail-evenement',
  imports: [RouterLink, BoutonRetour, VisuelEvenement],
  templateUrl: './detail-evenement.html',
  styleUrl: './detail-evenement.scss',
})
export class DetailEvenement {
  private readonly evenementService = inject(EvenementService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly urlRetour = signal<string | null>(null);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actualiserSujet = new Subject<void>();

  protected readonly evenement = signal<Evenement | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly participants = signal<PageParticipants | null>(null);
  protected readonly chargementParticipants = signal(false);
  protected readonly erreurParticipants = signal<string | null>(null);
  protected readonly confirmationAnnulation = signal(false);
  protected readonly actionEnCours = signal(false);
  protected readonly erreurAction = signal<string | null>(null);
  protected readonly reponseEnCours = signal<ReponseParticipation | null>(null);
  protected readonly erreurReponse = signal<string | null>(null);
  protected readonly estAdmin = computed(() => this.authService.utilisateur()?.role === 'ADMIN');
  protected readonly peutGerer = computed(() => {
    const evenement = this.evenement();
    const utilisateur = this.authService.utilisateur();
    return !!evenement && (!!utilisateur && (utilisateur.role === 'ADMIN' || utilisateur.id === evenement.organisateurId));
  });

  constructor() {
    this.urlRetour.set(urlRetourInterne(etatNavigationEvenement().returnUrl));
    combineLatest([
      this.route.paramMap,
      this.actualiserSujet.pipe(startWith(undefined))
    ]).pipe(
      tap(() => {
        this.enChargement.set(true);
        this.messageErreur.set(null);
      }),
      switchMap(([params]) => this.evenementService.obtenir(params.get('id') ?? '').pipe(
        map((evenement) => ({ evenement, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          evenement: null,
          erreur: erreur.status === 404
            ? 'Cet événement n’est pas disponible.'
            : 'Impossible de charger cet événement.'
        }))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ evenement, erreur }) => {
      this.evenement.set(evenement);
      this.messageErreur.set(erreur);
      this.enChargement.set(false);
      this.participants.set(null);
      this.erreurParticipants.set(null);
      if (evenement && this.peutGerer()) void this.chargerParticipants(evenement.id, 0);
    });
  }

  protected actualiser(): void {
    this.actualiserSujet.next();
  }

  /** Page ouverte par « Retour » quand on arrive directement sur l’événement. */
  protected readonly urlSecours = (): string => {
    const urlRetour = this.urlRetour();
    if (urlRetour) return urlRetour;
    const params = this.route.snapshot.queryParamMap;
    const page = Number(params.get('page'));
    return this.router.serializeUrl(this.router.createUrlTree(['/evenements'], {
      queryParams: {
        periode: params.get('periode') === 'PASSES' ? 'PASSES' : 'AVENIR',
        page: Number.isSafeInteger(page) && page >= 0 ? page : 0,
        vue: params.get('vue') === 'mes' ? 'mes' : null
      }
    }));
  };

  protected formaterDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Dakar'
    }).format(new Date(date));
  }

  protected libelleAudience(audience: Evenement['audience']): string {
    return ({ ETUDIANTS: 'Étudiants', ALUMNI: 'Alumni', TOUS: 'Tous les membres' })[audience];
  }

  protected organisateur(evenement: Evenement): string {
    return [evenement.organisateurPrenom, evenement.organisateurNom].filter(Boolean).join(' ')
      || 'Membre EPT';
  }

  protected placesRestantes(evenement: Evenement): number | null {
    return evenement.nombrePlaces === null
      ? null
      : Math.max(0, evenement.nombrePlaces - evenement.nombreParticipants);
  }

  protected peutRepondre(evenement: Evenement): boolean {
    const role = this.authService.utilisateur()?.role;
    const dansAudience = evenement.audience === 'TOUS'
      || (evenement.audience === 'ALUMNI' && role === 'ALUMNI')
      || (evenement.audience === 'ETUDIANTS' && role === 'ETUDIANT');
    return evenement.statut === 'PUBLIE'
      && new Date(evenement.dateFin ?? evenement.dateDebut).getTime() > Date.now()
      && dansAudience;
  }

  protected capaciteAtteinte(evenement: Evenement): boolean {
    return evenement.nombrePlaces !== null
      && evenement.nombreParticipants >= evenement.nombrePlaces
      && evenement.maReponse !== 'PARTICIPERA';
  }

  protected async enregistrerReponse(reponse: ReponseParticipation): Promise<void> {
    const evenement = this.evenement();
    if (!evenement || !this.peutRepondre(evenement) || this.reponseEnCours()
        || evenement.maReponse === reponse) return;

    this.reponseEnCours.set(reponse);
    this.erreurReponse.set(null);
    try {
      this.evenement.set(await firstValueFrom(this.evenementService.repondre(evenement.id, reponse)));
      if (this.peutGerer()) await this.chargerParticipants(evenement.id, 0);
    } catch (erreur) {
      this.erreurReponse.set(erreur instanceof HttpErrorResponse && erreur.status === 409
        ? 'Cet événement est complet. Votre réponse n’a pas été modifiée.'
        : erreur instanceof HttpErrorResponse && erreur.status === 404
          ? 'Les réponses ne sont plus acceptées pour cet événement. Actualisez la fiche.'
          : 'Votre réponse n’a pas été enregistrée. Réessayez.');
    } finally {
      this.reponseEnCours.set(null);
    }
  }

  protected async chargerParticipants(id = this.evenement()?.id ?? '', page = 0): Promise<void> {
    if (!id) return;
    this.chargementParticipants.set(true);
    this.erreurParticipants.set(null);
    try {
      this.participants.set(await firstValueFrom(this.evenementService.listerParticipants(id, page)));
    } catch (erreur) {
      this.erreurParticipants.set(erreur instanceof HttpErrorResponse && erreur.status === 404
        ? 'La liste des participants n’est pas disponible pour ce compte.'
        : 'Impossible de charger la liste des participants.');
    } finally {
      this.chargementParticipants.set(false);
    }
  }

  protected demanderConfirmationAnnulation(): void {
    this.confirmationAnnulation.set(true);
    this.erreurAction.set(null);
  }

  protected abandonnerAnnulation(): void {
    this.confirmationAnnulation.set(false);
    this.erreurAction.set(null);
  }

  protected async confirmerAnnulation(): Promise<void> {
    const evenement = this.evenement();
    if (!evenement || this.actionEnCours()) return;
    this.actionEnCours.set(true);
    this.erreurAction.set(null);
    try {
      this.evenement.set(await firstValueFrom(this.evenementService.annuler(evenement.id)));
      this.confirmationAnnulation.set(false);
    } catch {
      this.erreurAction.set('L’annulation a échoué. Réessayez.');
    } finally {
      this.actionEnCours.set(false);
    }
  }

  protected libelleRole(role: string): string {
    return ({ ETUDIANT: 'Étudiant', ALUMNI: 'Alumni', PERSONNEL: 'Personnel', VISITEUR: 'Visiteur' } as Record<string, string>)[role]
      ?? 'Membre';
  }

  protected pagesParticipants(): number[] {
    const total = this.participants()?.totalPages ?? 0;
    if (total <= 5) return Array.from({ length: total }, (_, index) => index);
    const courant = this.participants()?.page ?? 0;
    const debut = Math.max(0, Math.min(courant - 1, total - 3));
    const visibles = Array.from({ length: 3 }, (_, index) => debut + index);
    return [...new Set([0, ...visibles, total - 1])].sort((a, b) => a - b);
  }
}
