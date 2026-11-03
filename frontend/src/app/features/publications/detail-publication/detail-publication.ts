import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Publication, PublicationService } from '../../../core/services/publications/publication';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { CartePublication } from '../../../shared/publications/carte-publication/carte-publication';

/** Page d’une publication : tout son texte et toute sa discussion. Ouverte depuis le fil ou un lien partagé. */
@Component({
  selector: 'app-detail-publication',
  imports: [RouterLink, BoutonRetour, CartePublication],
  template: `
    <div class="page">
      <app-bouton-retour secours="/accueil" libelle="Retour au fil" />
      <h1 class="visuellement-cache">Publication</h1>
      @switch (etat()) {
        @case ('chargement') { <p class="etat" role="status">Chargement de la publication…</p> }
        @case ('introuvable') {
          <section class="etat vide">
            <i class="pi pi-eye-slash" aria-hidden="true"></i>
            <h2>Cette publication n’est plus disponible</h2>
            <p>Elle a peut-être été retirée, ou elle ne s’adresse pas à votre profil.</p>
            <a routerLink="/accueil">Revenir au fil d’actualité</a>
          </section>
        }
        @case ('erreur') {
          <p class="etat" role="alert">Impossible de charger la publication.
            <button type="button" (click)="charger()">Réessayer</button></p>
        }
        @default {
          @if (publication(); as p) {
            <app-carte-publication [publication]="p" [complete]="true" [commenterAuChargement]="commenter" />
          }
        }
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .page { box-sizing: border-box; max-width: 46rem; margin: 0 auto; padding: 1.5rem 2rem 6rem; }
    @media (max-width: 560px) { .page { padding: 1rem 1rem 6rem; } }
    .etat { color: var(--ept-text-secondary); }
    .etat button, .vide a { padding: .3rem .2rem; border: 0; background: transparent; color: var(--ept-primary);
      font: inherit; font-weight: 600; cursor: pointer; }
    .vide { display: grid; justify-items: center; gap: .4rem; padding: 2.5rem 1rem; border: 1px solid var(--ept-border);
      border-radius: var(--ept-radius); background: var(--ept-surface); text-align: center; }
    .vide i { font-size: 1.6rem; color: var(--ept-text-secondary); }
    .vide h2 { margin: .3rem 0 0; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.15rem; }
    .vide p { margin: 0; }
    button:focus-visible, a:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 2px; }
    .visuellement-cache { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
      clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  `,
})
export class DetailPublication {
  private readonly route = inject(ActivatedRoute);
  private id = '';
  /** Arrivée depuis « Commenter » dans le fil : la saisie du commentaire reçoit le focus. */
  protected readonly commenter = this.route.snapshot.queryParamMap.has('commenter');

  private readonly service = inject(PublicationService);
  protected readonly publication = signal<Publication | undefined>(undefined);
  private readonly echec = signal<'introuvable' | 'erreur' | undefined>(undefined);
  protected readonly etat = computed(() => this.echec() ?? (this.publication() ? 'pret' : 'chargement'));

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((parametres) => {
      this.id = parametres.get('id') ?? '';
      this.charger();
    });
  }

  protected charger(): void {
    this.publication.set(undefined);
    this.echec.set(undefined);
    this.service.obtenir(this.id).subscribe({
      next: (publication) => this.publication.set(publication),
      error: (erreur: HttpErrorResponse) => this.echec.set(erreur.status === 404 ? 'introuvable' : 'erreur'),
    });
  }
}
