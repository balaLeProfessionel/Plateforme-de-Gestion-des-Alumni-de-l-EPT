import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { EvenementService } from '../../core/services/evenements/evenement';
import { ProgrammeService } from '../../core/services/mentorat/programmes';
import { AUCUN_FILTRE, Evenement } from '../../core/services/models/evenement';
import { Programme } from '../../core/services/models/mentorat.model';
import { Publication, PublicationService } from '../../core/services/publications/publication';
import { CartePublication } from '../../shared/publications/carte-publication/carte-publication';
import { AuthService } from '../../core/services/auth/auth-service';
import { AvatarMembre } from '../../shared/images/avatar-membre';
import { EtatPublicationCreee } from '../publications/creation-publication/creation-publication';

type CarteFil = { type: 'publication'; contenu: Publication }
  | { type: 'evenement'; contenu: Evenement } | { type: 'programme'; contenu: Programme };

/** Fil d’actualité : publications des membres et de l’école, entrecoupées des événements et programmes ouverts. */
@Component({ selector: 'app-accueil', imports: [DatePipe, RouterLink, AvatarMembre, CartePublication],
  templateUrl: './accueil.html', styleUrl: './accueil.scss' })
export class Accueil {
  private readonly publicationService = inject(PublicationService);
  private readonly evenementService = inject(EvenementService);
  private readonly programmeService = inject(ProgrammeService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cartes = signal<CarteFil[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreurs = signal<string[]>([]);
  protected readonly moi = inject(AuthService).utilisateur;
  protected readonly invitation = computed(() =>
    this.moi()?.prenom ? `Quoi de neuf, ${this.moi()?.prenom} ?` : 'Partager une actualité avec la communauté');
  /** Confirmation laissée par la page de création quand on revient au fil après avoir publié. */
  protected readonly confirmation = signal(this.lireConfirmation());

  constructor() {
    this.charger();
  }

  private lireConfirmation(): string {
    // Seule la navigation en cours compte : un rechargement de la page ne répète pas la confirmation.
    const etat = (inject(Router).getCurrentNavigation()?.extras.state ?? {}) as EtatPublicationCreee;
    return typeof etat.messagePublication === 'string' ? etat.messagePublication : '';
  }

  protected charger(): void {
    this.chargement.set(true);
    this.erreurs.set([]);
    forkJoin({
      publications: this.publicationService.lister().pipe(
        map((page) => ({ valeur: page.contenu, erreur: false })),
        catchError(() => of({ valeur: [] as Publication[], erreur: true }))),
      evenements: this.evenementService.lister('AVENIR', 0, AUCUN_FILTRE, 3).pipe(
        map((page) => ({ valeur: page.contenu, erreur: false })),
        catchError(() => of({ valeur: [] as Evenement[], erreur: true }))),
      programmes: this.programmeService.listerOuverts().pipe(
        map((programmes) => ({ valeur: programmes.slice(0, 3), erreur: false })),
        catchError(() => of({ valeur: [] as Programme[], erreur: true }))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ publications, evenements, programmes }) => {
      const cartes: CarteFil[] = [];
      const taille = Math.max(publications.valeur.length, evenements.valeur.length, programmes.valeur.length);
      for (let i = 0; i < taille; i++) {
        if (publications.valeur[i]) cartes.push({ type: 'publication', contenu: publications.valeur[i] });
        if (evenements.valeur[i]) cartes.push({ type: 'evenement', contenu: evenements.valeur[i] });
        if (programmes.valeur[i]) cartes.push({ type: 'programme', contenu: programmes.valeur[i] });
      }
      this.cartes.set(cartes);
      this.erreurs.set([
        ...(publications.erreur ? ['publications'] : []), ...(evenements.erreur ? ['événements'] : []),
        ...(programmes.erreur ? ['programmes de mentorat'] : []),
      ]);
      this.chargement.set(false);
    });
  }
}
