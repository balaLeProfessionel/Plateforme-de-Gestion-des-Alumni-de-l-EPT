import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';

import { AuthService } from '../../../core/services/auth/auth-service';
import { Experience, Formation, ProfilPublic } from '../../../core/services/models/profil.model';
import { ProfilService } from '../../../core/services/profil/profil-service';

type TypeParcours = 'experience' | 'formation';

@Component({
  selector: 'app-detail-parcours',
  imports: [RouterLink],
  templateUrl: './detail-parcours.html',
  styleUrl: './detail-parcours.scss'
})
export class DetailParcours {
  private readonly profilService = inject(ProfilService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly type = this.route.snapshot.data['typeParcours'] as TypeParcours;
  protected readonly profil = signal<ProfilPublic | null>(null);
  protected readonly parcoursId = signal('');
  protected readonly enChargement = signal(true);
  protected readonly enSuppression = signal(false);
  protected readonly confirmeSuppression = signal(false);
  protected readonly messageErreur = signal<string | null>(null);

  protected readonly experience = computed(() =>
    this.type === 'experience'
      ? this.profil()?.experiences.find((item) => item.id === this.parcoursId()) ?? null
      : null
  );
  protected readonly formation = computed(() =>
    this.type === 'formation'
      ? this.profil()?.formations.find((item) => item.id === this.parcoursId()) ?? null
      : null
  );
  protected readonly item = computed(() => this.experience() ?? this.formation());
  protected readonly estProprietaire = computed(() =>
    this.authService.utilisateur()?.id === this.profil()?.id
  );
  protected readonly lienRetour = computed(() =>
    this.estProprietaire() ? ['/profil'] : ['/profil', this.profil()?.id]
  );
  protected readonly lienModification = computed(() => [
    '/completer-profil', this.type === 'experience' ? 'experiences' : 'formations'
  ]);
  protected readonly titre = computed(() =>
    this.experience()?.poste ?? this.formation()?.libelle ?? ''
  );
  protected readonly description = computed(() =>
    this.experience()?.description ?? this.formation()?.description ?? null
  );
  protected readonly estEpt = computed(() => this.item()?.etablissementEpt ?? false);

  constructor() {
    this.route.paramMap.pipe(
      tap(() => {
        this.enChargement.set(true);
        this.messageErreur.set(null);
        this.confirmeSuppression.set(false);
      }),
      switchMap((parametres) => {
        const membreId = parametres.get('id') ?? '';
        const parcoursId = parametres.get('parcoursId') ?? '';
        this.parcoursId.set(parcoursId);
        return this.profilService.obtenirProfilPublic(membreId).pipe(
          map((profil) => ({ profil, parcoursId }))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ profil, parcoursId }) => {
        this.profil.set(profil);
        const existe = this.type === 'experience'
          ? profil.experiences.some((item) => item.id === parcoursId)
          : profil.formations.some((item) => item.id === parcoursId);
        if (!existe) {
          this.messageErreur.set(
            this.type === 'experience' ? 'Cette expérience est introuvable.' : 'Cette formation est introuvable.'
          );
        }
        this.enChargement.set(false);
      },
      error: (erreur: HttpErrorResponse) => {
        this.messageErreur.set(
          erreur.status === 404 ? 'Ce parcours est introuvable.' : 'Impossible de charger ce parcours.'
        );
        this.enChargement.set(false);
      }
    });
  }

  protected libelleType(): string {
    const experience = this.experience();
    if (experience) {
      return ({
        CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', FREELANCE: 'Freelance',
        FONCTION_PUBLIQUE: 'Fonction publique'
      })[experience.typeContrat];
    }
    const formation = this.formation();
    return formation ? ({
      DIPLOMANTE: 'Formation diplômante', CERTIFICATION: 'Certification',
      SEMINAIRE: 'Séminaire', AUTRE: 'Autre formation'
    })[formation.typeFormation] : '';
  }

  protected periode(): string {
    const item = this.item();
    if (!item) return '';
    const debut = this.formaterDate(item.dateDebut);
    if (item.enCours) return `Depuis le ${debut}`;
    return item.dateFin ? `${debut} – ${this.formaterDate(item.dateFin)}` : debut;
  }

  protected demanderSuppression(): void {
    this.confirmeSuppression.set(true);
  }

  protected annulerSuppression(): void {
    this.confirmeSuppression.set(false);
  }

  protected supprimer(): void {
    if (!this.estProprietaire() || !this.item()) return;
    this.enSuppression.set(true);
    const requete = this.type === 'experience'
      ? this.profilService.supprimerExperience(this.parcoursId())
      : this.profilService.supprimerFormation(this.parcoursId());
    requete.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => void this.router.navigate(this.lienRetour()),
      error: () => {
        this.messageErreur.set('La suppression a échoué. Réessayez.');
        this.enSuppression.set(false);
        this.confirmeSuppression.set(false);
      }
    });
  }

  private formaterDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(`${date}T00:00:00Z`));
  }
}
