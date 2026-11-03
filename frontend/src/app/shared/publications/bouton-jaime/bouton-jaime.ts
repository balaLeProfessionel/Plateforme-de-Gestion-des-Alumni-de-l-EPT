import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PublicationService } from '../../../core/services/publications/publication';

/**
 * Bouton « J’aime » de la barre d’actions. Le décompte change tout de suite et revient en arrière si le
 * serveur refuse ; le parent lit `nombre` et `jaime` pour sa ligne de résumé.
 */
@Component({
  selector: 'app-bouton-jaime',
  template: `
    <button type="button" class="jaime" [class.actif]="jaime()" [attr.aria-pressed]="jaime()"
      [disabled]="envoi()" (click)="basculer()">
      <i class="pi" [class.pi-thumbs-up]="!jaime()" [class.pi-thumbs-up-fill]="jaime()" aria-hidden="true"></i>
      J’aime
    </button>
    @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
  `,
  styles: `
    :host { display: contents; }
    .jaime { display: inline-flex; flex: 1 1 0; align-items: center; justify-content: center; gap: .5rem;
      min-height: 2.75rem; padding: .4rem .75rem; border: 0; border-radius: var(--ept-radius-sm); background: transparent;
      color: var(--ept-text-secondary); font: inherit; font-weight: 600; cursor: pointer; }
    .jaime:hover { background: var(--ept-bg); color: var(--ept-primary); }
    .jaime:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 1px; }
    .jaime.actif { color: var(--ept-primary); }
    .jaime.actif i { animation: pouce .32s ease-out; }
    .jaime:disabled { cursor: progress; }
    i { font-size: 1.1rem; }
    .erreur { flex-basis: 100%; order: 10; margin: .25rem .5rem 0; color: var(--ept-error-dark); font-size: .85rem; }
    @keyframes pouce { 40% { transform: scale(1.3) rotate(-12deg); } }
    @media (prefers-reduced-motion: reduce) { .jaime.actif i { animation: none; } }
  `,
})
export class BoutonJaime {
  readonly publicationId = input.required<string>();
  readonly nombre = model(0);
  readonly jaime = model(false);
  protected readonly envoi = signal(false);
  protected readonly erreur = signal('');
  private readonly service = inject(PublicationService);
  private readonly destroyRef = inject(DestroyRef);

  protected basculer(): void {
    if (this.envoi()) return;
    const avant = { nombre: this.nombre(), jaime: this.jaime() };
    const aimer = !avant.jaime;
    this.jaime.set(aimer);
    this.nombre.set(Math.max(0, avant.nombre + (aimer ? 1 : -1)));
    this.envoi.set(true);
    this.erreur.set('');
    const requete = aimer ? this.service.aimer(this.publicationId()) : this.service.retirerJaime(this.publicationId());
    requete.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (etat) => { this.nombre.set(etat.nombre); this.jaime.set(etat.jaime); this.envoi.set(false); },
      error: (reponse: HttpErrorResponse) => {
        this.envoi.set(false);
        // 409 : une autre requête a déjà enregistré ce « J’aime », l’état affiché est le bon.
        if (reponse.status === 409) return;
        this.nombre.set(avant.nombre);
        this.jaime.set(avant.jaime);
        this.erreur.set(reponse.status === 404 ? 'Cette publication n’est plus disponible.'
          : 'Votre « J’aime » n’a pas été enregistré. Réessayez.');
      },
    });
  }
}
