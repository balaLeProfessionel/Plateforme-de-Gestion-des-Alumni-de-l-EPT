import { DatePipe, DOCUMENT, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, map, switchMap, tap } from 'rxjs';

import { AuthService } from '../../../core/services/auth/auth-service';
import { participeAuMentorat } from '../../../core/services/models/mentorat.model';
import {
  Experience,
  Formation,
  Profil,
  ProfilPublic
} from '../../../core/services/models/profil.model';
import { ProfilService } from '../../../core/services/profil/profil-service';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { OffreMentoratProfil } from '../../mentorat/offre-mentorat-profil/offre-mentorat-profil';
import { FenetreParcours, ParcoursOuvert } from './fenetre-parcours/fenetre-parcours';
import { ElementParcours, FriseParcours, parametresEtape } from './frise-parcours/frise-parcours';

interface Tuile {
  libelle: string;
  valeur: string;
  icone: string;
}

interface ProfilAffiche extends ProfilPublic {
  email?: string;
  telephone?: string | null;
  dateNaissance?: string | null;
}

@Component({
  selector: 'app-consultation-profil',
  imports: [DatePipe, RouterLink, BoutonRetour, AvatarMembre, OffreMentoratProfil, FenetreParcours, FriseParcours],
  templateUrl: './consultation-profil.html',
  styleUrl: './consultation-profil.scss'
})
export class ConsultationProfil {
  private readonly profilService = inject(ProfilService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly location = inject(Location);
  /** La fenêtre a été ouverte depuis la frise : la fermer revient en arrière dans l’historique. */
  private ouvertureInterne = false;

  protected readonly profil = signal<ProfilAffiche | null>(null);
  protected readonly estMonProfil = signal(false);
  protected readonly participeAuMentorat = participeAuMentorat;
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly lienCopie = signal(false);

  protected readonly badgeRole = computed(() => ({
    ETUDIANT: 'Étudiant',
    ALUMNI: 'Alumni',
    PERSONNEL: 'Personnel',
    VISITEUR: 'Visiteur'
  } as Record<string, string>)[this.profil()?.role ?? ''] ?? this.profil()?.role);

  /** L’employeur actuel, déduit de l’expérience en cours. */
  protected readonly organismeActuel = computed(() =>
    this.profil()?.experiences.find((experience) => experience.enCours)?.nomOrganisme ?? null);

  protected readonly tuiles = computed((): Tuile[] => {
    const profil = this.profil();
    if (!profil) return [];
    const tuiles: Tuile[] = [];
    if (profil.anneeSortie) tuiles.push({ libelle: 'Promotion', valeur: String(profil.anneeSortie), icone: 'pi-graduation-cap' });
    if (profil.filiere) tuiles.push({ libelle: 'Filière', valeur: profil.filiere, icone: 'pi-building-columns' });
    if (profil.villeResidence) tuiles.push({ libelle: 'Ville', valeur: profil.villeResidence, icone: 'pi-map-marker' });
    return tuiles;
  });

  /** Expériences et formations sur une seule frise, l’EPT mise en valeur. */
  protected readonly parcours = computed((): ElementParcours[] => {
    const profil = this.profil();
    if (!profil) return [];
    const elements: ElementParcours[] = [
      ...profil.experiences.map((experience): ElementParcours => ({
        type: 'experience', id: experience.id, titre: experience.poste, organisme: experience.nomOrganisme,
        libelleType: this.libelleContrat(experience.typeContrat), description: experience.description,
        periode: this.periode(experience), ept: experience.etablissementEpt, enCours: experience.enCours,
        tri: this.cleTri(experience),
      })),
      ...profil.formations.map((formation): ElementParcours => ({
        type: 'formation', id: formation.id, titre: formation.libelle, organisme: formation.nomOrganisme,
        libelleType: this.libelleFormation(formation.typeFormation), description: formation.description,
        periode: this.periode(formation), ept: formation.etablissementEpt, enCours: formation.enCours,
        tri: this.cleTri(formation),
      })),
    ];
    return elements.sort((a, b) => b.tri.localeCompare(a.tri));
  });

  /** Étape demandée par l’adresse : ?experience=<id> ou ?formation=<id>. */
  private readonly etapeDemandee = toSignal(this.route.queryParamMap.pipe(map((parametres) => {
    const experience = parametres.get('experience');
    const formation = parametres.get('formation');
    if (experience) return { type: 'experience' as const, id: experience };
    return formation ? { type: 'formation' as const, id: formation } : null;
  })), { initialValue: null });

  /** Place de l’étape ouverte dans la frise, pour aller à la plus récente ou à la plus ancienne. */
  protected readonly indexOuvert = computed(() => {
    const demandee = this.etapeDemandee();
    return demandee ? this.parcours().findIndex((element) => element.type === demandee.type && element.id === demandee.id) : -1;
  });

  protected readonly parcoursOuvert = computed((): ParcoursOuvert | null => {
    const demandee = this.etapeDemandee();
    const profil = this.profil();
    if (!demandee || !profil) return null;
    const item = demandee.type === 'experience'
      ? profil.experiences.find((experience) => experience.id === demandee.id)
      : profil.formations.find((formation) => formation.id === demandee.id);
    return item ? { type: demandee.type, item } : null;
  });

  constructor() {
    this.route.paramMap.pipe(
      tap(() => {
        this.enChargement.set(true);
        this.messageErreur.set(null);
      }),
      switchMap((parametres) => {
        const id = parametres.get('id');
        // /profil/<mon-id> (lien depuis l'annuaire, par exemple) reste mon profil complet.
        const moi = !id || id === this.authService.utilisateur()?.id;
        this.estMonProfil.set(moi);
        return moi ? this.chargerMonProfil() : this.profilService.obtenirProfilPublic(id);
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


  protected ouvrirDepuisFrise(): void {
    this.ouvertureInterne = true;
  }

  protected fermerFenetre(): void {
    if (!this.etapeDemandee()) return;
    if (this.ouvertureInterne) {
      this.ouvertureInterne = false;
      this.location.back();
    } else {
      void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  protected allerA(decalage: number): void {
    const element = this.parcours()[this.indexOuvert() + decalage];
    if (!element) return;
    void this.router.navigate([], { relativeTo: this.route, queryParams: parametresEtape(element), replaceUrl: true });
  }

  protected retirerDuParcours(supprime: ParcoursOuvert): void {
    this.profil.update((profil) => profil && ({
      ...profil,
      experiences: profil.experiences.filter((experience) => experience.id !== supprime.item.id),
      formations: profil.formations.filter((formation) => formation.id !== supprime.item.id),
    }));
    this.fermerFenetre();
  }

  protected async copierLien(): Promise<void> {
    const fenetre = this.document.defaultView;
    try {
      await fenetre?.navigator.clipboard.writeText(fenetre.location.href);
      this.lienCopie.set(true);
      fenetre?.setTimeout(() => this.lienCopie.set(false), 2500);
    } catch {
      this.lienCopie.set(false);
    }
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

  private cleTri(item: Experience | Formation): string {
    return (item.enCours ? '9' : '0') + (item.dateFin ?? item.dateDebut) + item.dateDebut;
  }

  private annee(date: string): string {
    return date.slice(0, 4);
  }
}
