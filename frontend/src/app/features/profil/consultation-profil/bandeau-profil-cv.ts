import { Component, ElementRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

// Message d'accueil affiché une fois, à l'arrivée sur le profil juste rempli à partir du CV.
@Component({
  selector: 'app-bandeau-profil-cv',
  imports: [RouterLink],
  template: `
    @if (!ferme()) {
      <section class="bandeau" role="status" aria-labelledby="titre-bandeau-cv">
        <span class="icone" aria-hidden="true"><i class="pi pi-check"></i></span>
        <div class="texte">
          <h2 id="titre-bandeau-cv">Votre profil est prêt</h2>
          <p>Nous l'avons rempli à partir de votre CV. Prenez une minute pour le relire.</p>
        </div>
        <a class="verifier" routerLink="/profil/parametres">
          <i class="pi pi-pencil" aria-hidden="true"></i>Relire et corriger
        </a>
        <button type="button" class="fermer" (click)="fermer()" aria-label="Fermer ce message">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </section>
    }
  `,
  styles: `
    .bandeau {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem 1rem;
      margin-top: 1rem;
      padding: 1rem 3rem 1rem 1rem;
      border-radius: var(--ept-radius);
      background: var(--ept-primary-light);
      color: var(--ept-primary);
    }
    .icone {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: var(--ept-sky);
      color: var(--ept-sky-text-on);
      .pi { font-size: 1rem; font-weight: 700; }
    }
    .texte { flex: 1 1 11rem; min-width: 0; }
    h2 { margin: 0; font-size: 1.05rem; }
    p { margin: 0.15rem 0 0; color: var(--ept-text-secondary); font-size: 0.9rem; line-height: 1.45; }
    .verifier {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      border-radius: var(--ept-radius-sm);
      background: var(--ept-primary);
      color: var(--ept-surface);
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      white-space: nowrap;
      &:hover { background: var(--ept-primary-dark); }
    }
    .fermer {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--ept-primary);
      cursor: pointer;
      &:hover { background: rgba(1, 67, 101, 0.08); }
    }
    .verifier:focus-visible, .fermer:focus-visible { outline: 2px solid var(--ept-primary); outline-offset: 2px; }
    @media (max-width: 560px) {
      .verifier { flex: 1 1 100%; justify-content: center; }
    }
  `
})
export class BandeauProfilCv {
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly ferme = signal(false);

  // Le bouton disparaît avec le bandeau : le focus passe au nom du membre, juste après,
  // au lieu de retomber en haut de la page.
  protected fermer(): void {
    const titre = this.hote.nativeElement.parentElement?.querySelector<HTMLElement>('h1');
    this.ferme.set(true);
    if (titre) {
      titre.tabIndex = -1;
      titre.focus();
    }
  }
}
