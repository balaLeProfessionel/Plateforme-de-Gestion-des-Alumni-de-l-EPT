import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../../core/services/mentorat/compteur-demandes';
import { MentoratService } from '../../../core/services/mentorat/mentorat';
import { Mentor, ProfilMentor, participeAuMentorat } from '../../../core/services/models/mentorat.model';
import { DialogueDemande } from '../dialogue-demande/dialogue-demande';

/**
 * Le mentorat sur le profil d'un membre : son offre et la demande directe ;
 * sur son propre profil, le membre retrouve son offre ou une invitation à en proposer une.
 */
@Component({
  selector: 'app-offre-mentorat-profil',
  imports: [RouterLink, DialogueDemande],
  templateUrl: './offre-mentorat-profil.html',
  styleUrl: './offre-mentorat-profil.scss',
})
export class OffreMentoratProfil {
  private readonly mentoratService = inject(MentoratService);
  private readonly authService = inject(AuthService);
  private readonly compteur = inject(CompteurDemandesMentorat);

  readonly utilisateurId = input.required<string>();
  readonly estMonProfil = input(false);

  /** Offre d'un autre membre (null : il n'en propose pas). */
  protected readonly mentor = signal<Mentor | null>(null);
  /** Ma propre offre, sur mon profil. */
  protected readonly monOffre = signal<ProfilMentor | null>(null);
  protected readonly charge = signal(false);
  protected readonly mentorSollicite = signal<Mentor | null>(null);
  protected readonly confirmation = signal<string | null>(null);

  protected readonly peutDemander = computed(() => participeAuMentorat(this.authService.utilisateur()?.role));
  protected readonly blocage = computed(() => {
    const mentor = this.mentor();
    if (!mentor) return null;
    if (mentor.demandeEnCours) return 'Vous avez déjà une demande en cours avec ce mentor.';
    if (this.compteur.limiteAtteinte()) {
      return `Vous avez déjà ${this.compteur.envoyees()} demandes en attente : attendez une réponse ou annulez-en une.`;
    }
    if (!mentor.disponible) return 'Ce mentor n’accepte pas de nouvelle demande pour le moment.';
    if (mentor.placesRestantes <= 0) return 'Ce mentor accompagne déjà le nombre maximum de personnes.';
    return null;
  });

  constructor() {
    if (this.peutDemander()) this.compteur.actualiser();
    // switchMap : en passant d'un profil à l'autre, la réponse du précédent est ignorée.
    toObservable(computed(() => ({ id: this.utilisateurId(), moi: this.estMonProfil() }))).pipe(
      tap(() => {
        this.charge.set(false);
        this.confirmation.set(null);
      }),
      switchMap(({ id, moi }) => moi
        ? this.mentoratService.obtenirMonProfil().pipe(
          map((offre) => ({ offre, mentor: null })), catchError(() => of({ offre: null, mentor: null })))
        : this.mentoratService.obtenirMentor(id).pipe(
          map((mentor) => ({ offre: null, mentor })), catchError(() => of({ offre: null, mentor: null })))),
      takeUntilDestroyed()
    ).subscribe(({ offre, mentor }) => {
      this.monOffre.set(offre);
      this.mentor.set(mentor);
      this.charge.set(true);
    });
  }

  protected demandeEnvoyee(): void {
    const mentor = this.mentorSollicite();
    this.mentorSollicite.set(null);
    if (!mentor) return;
    this.mentor.set({ ...mentor, demandeEnCours: true });
    this.confirmation.set('Votre demande a été envoyée. Vous la suivez dans Mentorat › Mes mentorats.');
    this.compteur.actualiser();
  }
}
