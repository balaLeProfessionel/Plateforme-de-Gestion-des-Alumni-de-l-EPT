import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, map, switchMap, tap } from 'rxjs';

import {
  Experience,
  Formation,
  Profil,
  ProfilPublic
} from '../../../core/services/models/profil.model';
import { ProfilService } from '../../../core/services/profil/profil-service';

interface ProfilAffiche extends ProfilPublic {
  email?: string;
  telephone?: string | null;
  dateNaissance?: string | null;
}

@Component({
  selector: 'app-consultation-profil',
  imports: [DatePipe, RouterLink],
  templateUrl: './consultation-profil.html',
  styleUrl: './consultation-profil.scss'
})
export class ConsultationProfil {
  private readonly profilService = inject(ProfilService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly profil = signal<ProfilAffiche | null>(null);
  protected readonly estMonProfil = signal(false);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly imageInvalide = signal(false);

  protected readonly initiales = computed(() => {
    const profil = this.profil();
    return `${profil?.prenom?.charAt(0) ?? ''}${profil?.nom?.charAt(0) ?? ''}`.toUpperCase();
  });

  protected readonly badgeRole = computed(() => ({
    ETUDIANT: 'Étudiant',
    ALUMNI: 'Alumni',
    PERSONNEL: 'Personnel',
    VISITEUR: 'Visiteur'
  } as Record<string, string>)[this.profil()?.role ?? ''] ?? this.profil()?.role);

  protected readonly aLiens = computed(() => {
    const profil = this.profil();
    return Boolean(profil?.lienLinkedin || profil?.lienPortfolio);
  });

  protected readonly experiencesEpt = computed(() =>
    this.profil()?.experiences.filter((experience) => experience.etablissementEpt) ?? []
  );
  protected readonly formationsEpt = computed(() =>
    this.profil()?.formations.filter((formation) => formation.etablissementEpt) ?? []
  );
  protected readonly experiencesHorsEpt = computed(() =>
    this.profil()?.experiences.filter((experience) => !experience.etablissementEpt) ?? []
  );
  protected readonly formationsHorsEpt = computed(() =>
    this.profil()?.formations.filter((formation) => !formation.etablissementEpt) ?? []
  );
  protected readonly aParcoursEpt = computed(() =>
    this.experiencesEpt().length > 0 || this.formationsEpt().length > 0
  );

  constructor() {
    this.route.paramMap.pipe(
      tap(() => {
        this.enChargement.set(true);
        this.messageErreur.set(null);
        this.imageInvalide.set(false);
      }),
      switchMap((parametres) => {
        const id = parametres.get('id');
        this.estMonProfil.set(!id);
        return id ? this.profilService.obtenirProfilPublic(id) : this.chargerMonProfil();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (profil) => {
        this.profil.set(profil);
        this.enChargement.set(false);
      },
      error: (erreur: HttpErrorResponse) => {
        this.messageErreur.set(
          erreur.status === 404
            ? "Ce profil n'est pas disponible."
            : "Impossible de charger le profil."
        );
        this.enChargement.set(false);
      }
    });
  }

  protected periode(item: Experience | Formation): string {
    if (item.enCours) {
      return 'Depuis ' + this.annee(item.dateDebut);
    }
    const debut = this.annee(item.dateDebut);
    const fin = item.dateFin ? this.annee(item.dateFin) : null;
    return fin && fin !== debut ? `${debut} – ${fin}` : debut;
  }

  protected libelleContrat(type: Experience['typeContrat']): string {
    return ({
      CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', FREELANCE: 'Freelance',
      FONCTION_PUBLIQUE: 'Fonction publique'
    })[type];
  }

  protected libelleFormation(type: Formation['typeFormation']): string {
    return ({
      DIPLOMANTE: 'Formation diplômante', CERTIFICATION: 'Certification',
      SEMINAIRE: 'Séminaire', AUTRE: 'Autre formation'
    })[type];
  }

  private chargerMonProfil() {
    return forkJoin({
      profil: this.profilService.obtenirProfil(),
      experiences: this.profilService.listerExperiences(),
      formations: this.profilService.listerFormations()
    }).pipe(map(({ profil, experiences, formations }) => this.assembler(profil, experiences, formations)));
  }

  private assembler(profil: Profil, experiences: Experience[], formations: Formation[]): ProfilAffiche {
    return { ...profil, experiences, formations };
  }

  private annee(date: string): string {
    return date.slice(0, 4);
  }
}
