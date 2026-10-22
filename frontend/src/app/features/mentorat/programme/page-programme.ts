import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, catchError, firstValueFrom, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../../core/services/mentorat/compteur-demandes';
import { MentoratService } from '../../../core/services/mentorat/mentorat';
import { ProgrammeService } from '../../../core/services/mentorat/programmes';
import {
  LIBELLES_STATUT_PROGRAMME,
  Mentor,
  Programme,
  participeAuMentorat,
} from '../../../core/services/models/mentorat.model';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { CarteMentor } from '../carte-mentor/carte-mentor';
import { DialogueDemande } from '../dialogue-demande/dialogue-demande';

const MENTORS_AFFICHES = 24;

/**
 * Page d’un programme vue par les membres : sa présentation, ses étapes et ses mentors volontaires.
 * Un membre qui propose du mentorat peut s’y inscrire comme mentor.
 */
@Component({
  selector: 'app-page-programme',
  imports: [DatePipe, RouterLink, BoutonRetour, CarteMentor, DialogueDemande],
  templateUrl: './page-programme.html',
  styleUrl: './page-programme.scss',
})
export class PageProgramme {
  private readonly programmeService = inject(ProgrammeService);
  private readonly mentoratService = inject(MentoratService);
  private readonly authService = inject(AuthService);
  protected readonly compteur = inject(CompteurDemandesMentorat);

  protected readonly libellesStatut = LIBELLES_STATUT_PROGRAMME;
  protected readonly programme = signal<Programme | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly mentors = signal<Mentor[] | null>(null);
  protected readonly totalMentors = signal(0);
  /** null : pas encore su ; seuls les membres qui proposent du mentorat peuvent participer. */
  protected readonly aUneOffre = signal<boolean | null>(null);
  protected readonly enCours = signal(false);
  protected readonly messageAction = signal<string | null>(null);
  protected readonly mentorSollicite = signal<Mentor | null>(null);
  protected readonly confirmation = signal<string | null>(null);

  protected readonly participe = computed(() => participeAuMentorat(this.authService.utilisateur()?.role));
  protected readonly ouvert = computed(() => this.programme()?.statut === 'OUVERT');

  constructor() {
    if (this.participe()) {
      this.compteur.actualiser();
      this.mentoratService.obtenirMonProfil().pipe(map(() => true), catchError(() => of(false)))
        .subscribe((offre) => this.aUneOffre.set(offre));
    }
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      tap(() => {
        this.programme.set(null);
        this.erreur.set(null);
        this.mentors.set(null);
      }),
      switchMap((id) => this.programmeService.obtenir(id).pipe(
        map((programme) => ({ programme, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          programme: null,
          erreur: erreur.status === 404 ? 'Ce programme est introuvable.' : 'Impossible de charger le programme.',
        })))),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe(({ programme, erreur }) => {
      this.programme.set(programme);
      this.erreur.set(erreur);
      if (programme) this.chargerMentors(programme.id);
    });
  }

  protected participer(): void {
    this.changerParticipation((id) => this.programmeService.participer(id), 'Vous êtes désormais mentor volontaire de ce programme.');
  }

  protected seRetirer(): void {
    this.changerParticipation((id) => this.programmeService.seRetirer(id), 'Vous ne participez plus à ce programme.');
  }

  protected demandeEnvoyee(): void {
    const mentor = this.mentorSollicite();
    this.mentorSollicite.set(null);
    if (!mentor) return;
    this.confirmation.set(`Votre demande a été envoyée à ${mentor.prenom} ${mentor.nom}.`);
    this.mentors.update((liste) => liste?.map((m) => m.profilId === mentor.profilId ? { ...m, demandeEnCours: true } : m) ?? null);
    this.compteur.actualiser();
  }

  private async changerParticipation(action: (id: string) => Observable<Programme>, message: string): Promise<void> {
    const programme = this.programme();
    if (!programme || this.enCours()) return;
    this.enCours.set(true);
    this.messageAction.set(null);
    try {
      this.programme.set(await firstValueFrom(action(programme.id)));
      this.messageAction.set(message);
      this.chargerMentors(programme.id);
    } catch (erreur) {
      this.messageAction.set(erreur instanceof HttpErrorResponse && erreur.error?.message
        ? erreur.error.message
        : 'L’action n’a pas abouti. Réessayez.');
    } finally {
      this.enCours.set(false);
    }
  }

  private chargerMentors(programmeId: string): void {
    this.mentoratService.rechercherMentors(
      { recherche: '', domaine: '', disponibles: false, page: 0, programme: programmeId }, MENTORS_AFFICHES)
      .pipe(catchError(() => of(null)))
      .subscribe((page) => {
        this.mentors.set(page?.contenu ?? []);
        this.totalMentors.set(page?.totalElements ?? 0);
      });
  }
}
