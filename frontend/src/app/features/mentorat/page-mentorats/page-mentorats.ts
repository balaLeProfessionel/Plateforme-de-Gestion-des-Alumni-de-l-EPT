import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ListeMentorats, VueListeMentorats } from '../liste-mentorats/liste-mentorats';

interface DonneesPage {
  sections: VueListeMentorats[];
  titreVide: string;
  texteVide: string;
  invitation: { libelle: string; lien: string };
}

/**
 * « Mes mentorats » ou « Mes mentorés » : une page, des sections par état (ce qui attend une action
 * d’abord). Seules les sections non vides s’affichent ; une action dans l’une rafraîchit les autres,
 * puisqu’un mentorat accepté ou terminé change de section.
 */
@Component({
  selector: 'app-page-mentorats',
  imports: [RouterLink, ListeMentorats],
  template: `
    @if (toutVide()) {
      <div class="etat">
        <i class="pi pi-inbox" aria-hidden="true"></i>
        <h2>{{ donnees.titreVide }}</h2>
        <p>{{ donnees.texteVide }}</p>
        <a [routerLink]="donnees.invitation.lien">{{ donnees.invitation.libelle }}</a>
      </div>
    }
    @for (section of donnees.sections; track section.titre; let i = $index) {
      <section class="section" [hidden]="totaux()[i] === 0" [attr.aria-labelledby]="'section-mentorats-' + i">
        <h2 [id]="'section-mentorats-' + i">
          {{ section.titre }}
          @if (totaux()[i]; as nombre) { <span class="nombre">{{ nombre }}</span> }
        </h2>
        <app-liste-mentorats [vue]="section" [actualisation]="version()"
          (modifie)="version.set(version() + 1)" (total)="enregistrerTotal(i, $event)" />
      </section>
    }
  `,
  styles: `
    :host { display: grid; gap: 1.75rem; }
    .section h2 { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.75rem; color: var(--ept-primary-dark); font-size: 1.05rem; }
    .nombre { display: inline-grid; min-width: 1.5rem; height: 1.5rem; place-items: center; padding: 0 0.4rem; border-radius: 999px; background: var(--ept-bg); color: var(--ept-text-secondary); font-size: 0.78rem; }
    .etat { display: grid; justify-items: center; gap: 0.5rem; padding: 3.5rem 1rem; border: 1px dashed var(--ept-border); text-align: center; }
    .etat > i { color: var(--ept-primary); font-size: 1.7rem; }
    .etat h2, .etat p { margin: 0; }
    .etat p { max-width: 30rem; color: var(--ept-text-secondary); }
    .etat a { color: var(--ept-primary); font-weight: 700; }
    .etat a:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; }
  `,
})
export class PageMentorats {
  protected readonly donnees = inject(ActivatedRoute).snapshot.data as DonneesPage;
  protected readonly version = signal(0);
  /** null tant qu’une section n’a pas répondu. */
  protected readonly totaux = signal<(number | null)[]>(this.donnees.sections.map(() => null));
  protected readonly toutVide = computed(() => this.totaux().every((total) => total === 0));

  protected enregistrerTotal(index: number, total: number): void {
    this.totaux.update((totaux) => totaux.map((valeur, i) => i === index ? total : valeur));
  }
}
