import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { EvenementService } from '../../core/services/evenements/evenement';
import { ProgrammeService } from '../../core/services/mentorat/programmes';
import { AUCUN_FILTRE, Evenement } from '../../core/services/models/evenement';
import { Programme } from '../../core/services/models/mentorat.model';
import { NouvellePublication, Publication, PublicationService } from '../../core/services/publications/publication';
import { AvatarMembre } from '../../shared/images/avatar-membre';
import { ImagePublication } from '../../shared/images/image-publication/image-publication';

type CarteFil = { type: 'publication'; contenu: Publication }
  | { type: 'evenement'; contenu: Evenement } | { type: 'programme'; contenu: Programme };

@Component({ selector: 'app-accueil', imports: [DatePipe, RouterLink, AvatarMembre, ImagePublication, FormField],
  templateUrl: './accueil.html', styleUrl: './accueil.scss' })
export class Accueil {
  private readonly publicationService = inject(PublicationService);
  private readonly evenementService = inject(EvenementService);
  private readonly programmeService = inject(ProgrammeService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cartes = signal<CarteFil[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreurs = signal<string[]>([]);
  protected readonly redactionOuverte = signal(false);
  protected readonly envoiEnCours = signal(false);
  protected readonly messagePublication = signal('');
  protected readonly erreurPublication = signal('');
  protected readonly imageSelectionnee = signal<File | undefined>(undefined);
  protected readonly apercuImage = signal('');
  protected readonly modele = signal({ titre: '', contenu: '', audience: 'TOUS' as NouvellePublication['audience'] });
  protected readonly formulaire = form(this.modele, (champ) => {
    maxLength(champ.titre, 160);
    required(champ.contenu);
    maxLength(champ.contenu, 5000);
  });
  constructor() { this.charger(); this.destroyRef.onDestroy(() => this.retirerImage()); }

  protected choisirImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const image = input.files?.[0];
    this.retirerImage();
    if (!image) return;
    if (!['image/jpeg', 'image/png'].includes(image.type) || !/\.(jpe?g|png)$/i.test(image.name) || image.size > 5 * 1024 * 1024) {
      this.erreurPublication.set('Choisissez une image JPEG ou PNG de 5 Mo maximum.');
      input.value = '';
      return;
    }
    this.erreurPublication.set('');
    this.imageSelectionnee.set(image);
    this.apercuImage.set(URL.createObjectURL(image));
  }

  protected retirerImage(): void {
    const apercu = this.apercuImage();
    if (apercu) URL.revokeObjectURL(apercu);
    this.apercuImage.set('');
    this.imageSelectionnee.set(undefined);
  }

  protected publier(event: Event): void {
    event.preventDefault();
    if (this.envoiEnCours() || this.chargement()) return;
    const valeurs = this.modele();
    if (this.formulaire().invalid() || !valeurs.contenu.trim()) {
      this.erreurPublication.set('Ajoutez un texte de 5 000 caractères maximum.');
      return;
    }
    this.erreurPublication.set('');
    this.messagePublication.set('');
    this.envoiEnCours.set(true);
    this.publicationService.creer({ type: 'PUBLICATION', titre: valeurs.titre.trim(),
      contenu: valeurs.contenu.trim(), audience: valeurs.audience }, this.imageSelectionnee())
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (publication) => {
          this.cartes.update((cartes) => [{ type: 'publication', contenu: publication }, ...cartes]);
          this.modele.set({ titre: '', contenu: '', audience: 'TOUS' });
          this.retirerImage();
          this.redactionOuverte.set(false);
          this.messagePublication.set('Votre publication a été publiée.');
          this.envoiEnCours.set(false);
        },
        error: (erreur: HttpErrorResponse) => {
          this.erreurPublication.set(erreur.status === 400 || erreur.status === 413
            ? 'L’image ou les informations fournies ne sont pas valides. Vérifiez le format et la taille.' : erreur.status === 429
            ? 'Vous avez atteint la limite de publications pour les dernières 24 heures.'
            : 'Impossible de publier pour le moment. Réessayez.');
          this.envoiEnCours.set(false);
        },
      });
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
