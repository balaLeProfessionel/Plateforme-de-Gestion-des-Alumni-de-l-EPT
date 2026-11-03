import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Publication, PublicationService, TypePublication } from '../../../core/services/publications/publication';
import { CartePublication } from '../../../shared/publications/carte-publication/carte-publication';
import { RedactionPublication } from '../../../shared/publications/redaction-publication/redaction-publication';
import { PageAdmin } from '../page-admin/page-admin';

const TYPES_OFFICIELS: readonly TypePublication[] = ['ANNONCE_OFFICIELLE', 'APPEL_PROJET'];

/** Annonces officielles et appels à projets : rédaction réservée à l’administration, puis suivi dans le fil. */
@Component({
  selector: 'app-publications-officielles',
  imports: [PageAdmin, CartePublication, RedactionPublication],
  template: `
    <app-page-admin titre="Annonces et appels à projets"
      introduction="Les annonces portent le badge « Annonce officielle EPT » dans le fil de tous les membres visés. Un appel à projet affiche sa date limite de réponse, puis la mention « Clôturé » une fois celle-ci passée.">
      <app-redaction-publication [types]="types" libelleOuvrir="Rédiger une annonce ou un appel à projet"
        [desactivee]="chargement()" (publiee)="ajouter($event)" />
      <section aria-labelledby="titre-diffusees" [attr.aria-busy]="chargement()">
        <h2 id="titre-diffusees">Déjà diffusées</h2>
        @if (chargement() && !publications().length) { <p role="status">Chargement…</p> }
        @if (erreur()) {
          <p class="erreur" role="alert">Impossible de charger les publications officielles.
            <button type="button" (click)="charger(0)">Réessayer</button></p>
        }
        @if (!chargement() && !erreur() && !publications().length) {
          <p class="vide">Aucune annonce ni aucun appel à projet pour le moment.</p>
        }
        <ul>
          @for (publication of publications(); track publication.id) {
            <li><app-carte-publication [publication]="publication" /></li>
          }
        </ul>
        @if (page() + 1 < totalPages()) {
          <button type="button" class="suite" [disabled]="chargement()" (click)="charger(page() + 1)">Afficher les précédentes</button>
        }
      </section>
    </app-page-admin>
  `,
  styles: `
    app-redaction-publication { max-width: 46rem; }
    section { max-width: 46rem; margin-top: 1.5rem; }
    h2 { font-size: 1.1rem; color: var(--ept-primary-dark); margin: 0 0 .75rem; }
    ul { display: grid; grid-template-columns: minmax(0, 1fr); gap: .9rem; margin: 0; padding: 0; list-style: none; }
    li { min-width: 0; }
    .vide { color: var(--ept-text-secondary); }
    .erreur { color: var(--ept-error-dark); }
    button { font: inherit; cursor: pointer; }
    button:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 2px; }
    .erreur button, .suite { border-radius: var(--ept-radius-sm); margin-top: .75rem; padding: .55rem .9rem; border: 1px solid var(--ept-border); background: var(--ept-surface); color: var(--ept-primary); font-weight: 600; }
  `,
})
export class PublicationsOfficielles {
  protected readonly types = TYPES_OFFICIELS;
  protected readonly publications = signal<Publication[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal(false);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  private readonly service = inject(PublicationService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.charger(0);
  }

  protected ajouter(publication: Publication): void {
    this.publications.update((liste) => [publication, ...liste]);
  }

  protected charger(page: number): void {
    this.chargement.set(true);
    this.erreur.set(false);
    this.service.lister(page, 10, TYPES_OFFICIELS).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (resultat) => {
        this.publications.update((liste) => page === 0 ? resultat.contenu
          : [...liste, ...resultat.contenu.filter((p) => !liste.some((deja) => deja.id === p.id))]);
        this.page.set(resultat.page);
        this.totalPages.set(resultat.totalPages);
        this.chargement.set(false);
      },
      error: () => { this.erreur.set(true); this.chargement.set(false); },
    });
  }
}
