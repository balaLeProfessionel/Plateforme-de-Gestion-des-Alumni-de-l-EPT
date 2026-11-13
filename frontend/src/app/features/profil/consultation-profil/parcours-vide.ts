import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';

/** Mon parcours est vide : dire à quoi il sert et proposer les deux façons de le commencer. */
@Component({
  selector: 'app-parcours-vide',
  imports: [RouterLink, ButtonDirective, ButtonIcon, ButtonLabel],
  template: `
    <i class="pi pi-compass icone" aria-hidden="true"></i>
    <p class="titre">Racontez votre parcours</p>
    <p class="texte">Vos expériences et vos formations apparaîtront ici sous forme de frise.
      Elles aident les étudiants et les recruteurs à vous trouver dans l’annuaire.</p>
    <div class="actions">
      <a pButton routerLink="/profil/parametres" fragment="parcours">
        <i pButtonIcon class="pi pi-briefcase" aria-hidden="true"></i><span pButtonLabel>Ajouter une expérience</span></a>
      <a pButton outlined routerLink="/profil/parametres" fragment="formations">
        <i pButtonIcon class="pi pi-graduation-cap" aria-hidden="true"></i><span pButtonLabel>Ajouter une formation</span></a>
    </div>
  `,
  styles: `
    :host { display: grid; justify-items: center; gap: .4rem; padding: 1.75rem 1rem; border: 1px dashed var(--ept-border);
      border-radius: var(--ept-radius-sm); text-align: center; }
    .icone { color: var(--ept-primary); font-size: 1.6rem; }
    .titre { margin: 0; color: var(--ept-primary-dark); font-weight: 700; }
    .texte { max-width: 30rem; margin: 0 0 .5rem; color: var(--ept-text-secondary); font-size: .9rem; }
    .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; }
    .actions a { min-height: 2.75rem; text-decoration: none; }
  `,
})
export class ParcoursVide {}
