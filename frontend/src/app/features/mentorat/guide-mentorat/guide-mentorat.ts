import { Component, input } from '@angular/core';

/** Explique les deux rôles du mentorat et les étapes d'un accompagnement. */
@Component({
  selector: 'app-guide-mentorat',
  template: `
    <details class="guide" [open]="ouvert()">
      <summary><i class="pi pi-question-circle" aria-hidden="true"></i>Comment fonctionne le mentorat ?</summary>

      <div class="roles">
        <section aria-labelledby="guide-mentor">
          <h3 id="guide-mentor">Le mentor</h3>
          <p>Tout membre de l’EPT au compte vérifié (étudiant, alumni, personnel ou visiteur) qui partage son expérience.</p>
          <ul>
            <li>Il publie une offre : 1 à 5 domaines et une courte présentation.</li>
            <li>Il choisit combien de personnes il suit à la fois (1 à 10) et peut mettre son offre en pause.</li>
            <li>Il accepte ou refuse les demandes qu’il reçoit.</li>
          </ul>
        </section>
        <section aria-labelledby="guide-mentore">
          <h3 id="guide-mentore">Le mentoré</h3>
          <p>Tout membre accompagné par un autre : un lycéen qui s’oriente auprès d’un étudiant, un jeune diplômé auprès d’un ancien…</p>
          <ul>
            <li>Il choisit un mentor, un domaine, et décrit son objectif.</li>
            <li>Il peut solliciter plusieurs mentors : au plus 3 demandes en attente à la fois, et une seule demande en cours par mentor.</li>
            <li>Il peut annuler sa demande tant que le mentor n’a pas répondu.</li>
          </ul>
        </section>
      </div>

      <p class="deux-roles">Un même membre peut être mentor des uns et mentoré des autres.</p>

      <h3 class="titre-etapes">Les étapes</h3>
      <ol class="etapes">
        <li><strong>En attente</strong> : le mentoré a envoyé sa demande, le mentor doit répondre.</li>
        <li><strong>En cours</strong> : le mentor a accepté ; les deux planifient et consignent leurs séances.
          <span class="variante">Sinon <strong>refusée</strong> (avec un motif éventuel) ou <strong>annulée</strong> par le mentoré.</span></li>
        <li><strong>Terminée</strong> : l’un ou l’autre clôture le mentorat, puis chacun peut l’évaluer.</li>
      </ol>
    </details>
  `,
  styles: `
    :host { display: block; }
    .guide { border: 1px solid var(--ept-border); border-radius: 12px; background: var(--ept-surface, white); }
    summary {
      display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; padding: 0.6rem 1rem;
      color: var(--ept-primary); font-weight: 700; cursor: pointer;
      &:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; border-radius: 12px; }
    }
    .roles {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); gap: 1rem;
      padding: 0 1rem;
    }
    section { padding: 0.85rem 1rem; border-radius: 10px; background: var(--ept-bg); }
    h3 { margin: 0 0 0.35rem; color: var(--ept-primary-dark); font-size: 1rem; }
    p, li { color: var(--ept-primary-dark); font-size: 0.88rem; line-height: 1.5; }
    p { margin: 0 0 0.4rem; }
    ul, ol { margin: 0; padding-left: 1.2rem; }
    .deux-roles { margin: 0.85rem 1rem 0; color: var(--ept-text-secondary); }
    .titre-etapes { margin: 1rem 1rem 0.35rem; }
    .etapes { display: grid; gap: 0.35rem; padding: 0 1rem 1rem 2.2rem; }
    .variante { display: block; color: var(--ept-text-secondary); }
  `,
})
export class GuideMentorat {
  /** Déplié d'emblée (page de présentation) ou replié (au-dessus des onglets). */
  readonly ouvert = input(false);
}
