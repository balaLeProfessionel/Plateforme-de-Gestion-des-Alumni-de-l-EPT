import { Component, computed, input, linkedSignal } from '@angular/core';

/**
 * Photo d'un membre, ou à défaut ses initiales aux couleurs de son rôle (les mêmes que les cartes
 * de l'annuaire) : un membre sans photo reste reconnaissable et homogène partout.
 * Décoratif par défaut (le nom est affiché à côté) ; `libelle` le rend lisible seul.
 */
@Component({
  selector: 'app-avatar-membre',
  template: `
    @if (urlPhoto() && !imageInvalide()) {
      <img [src]="urlPhoto()" [attr.alt]="libelle() ?? ''" (error)="imageInvalide.set(true)" />
    } @else {
      <span class="initiales" [attr.aria-hidden]="libelle() ? null : 'true'"
        [attr.role]="libelle() ? 'img' : null" [attr.aria-label]="libelle()">
        @if (initiales()) { {{ initiales() }} } @else { <i class="pi pi-user" aria-hidden="true"></i> }
      </span>
    }
  `,
  styles: `
    :host {
      --fond: linear-gradient(135deg, var(--ept-primary-light), #cfe2ea);
      --texte: var(--ept-primary);

      display: inline-grid;
      width: var(--taille);
      height: var(--taille);
      flex: 0 0 auto;
      place-items: center;
      overflow: hidden;
      border-radius: 50%;
      background: var(--fond);
      color: var(--texte);
      font-family: var(--ept-font-heading);
      font-size: calc(var(--taille) * 0.38);
      font-weight: 700;
      letter-spacing: 0.02em;
      line-height: 1;
    }
    :host([data-role='ALUMNI']) { --fond: linear-gradient(135deg, #dff6fb, #b9ebf6); --texte: var(--ept-primary); }
    :host([data-role='ETUDIANT']) { --fond: linear-gradient(135deg, var(--ept-gold-light), #eedbbb); --texte: var(--ept-gold-dark); }
    :host([data-role='PERSONNEL']) { --fond: linear-gradient(135deg, var(--ept-primary), var(--ept-primary-dark)); --texte: white; }
    :host([data-role='VISITEUR']) { --fond: linear-gradient(135deg, #f1f3f5, #e7ebee); --texte: var(--ept-text-secondary); }
    :host([data-role='ORGANISME']) {
      --fond: linear-gradient(135deg, var(--ept-primary-dark), #01283c);
      --texte: white;
      border-radius: 22%;
      box-shadow: inset 0 -3px 0 var(--ept-sky);
    }
    img { width: 100%; height: 100%; object-fit: cover; }
    /* Un logo n'est pas recadré : il s'affiche entier sur fond blanc. */
    :host([data-role='ORGANISME']) img { padding: 8%; background: white; object-fit: contain; }
    .initiales { display: grid; width: 100%; height: 100%; place-items: center; }
    i { font-size: calc(var(--taille) * 0.42); }
  `,
  host: {
    '[attr.data-role]': 'roleMembre()',
    '[style.--taille]': 'taille() + "rem"',
  },
})
export class AvatarMembre {
  readonly urlPhoto = input<string | null | undefined>(null);
  readonly prenom = input<string | null | undefined>(null);
  readonly nom = input<string | null | undefined>('');
  /**
   * Rôle du membre : donne les couleurs du placeholder (ALUMNI, ETUDIANT, ORGANISME…).
   * Pas nommé `role` : l'attribut resterait sur l'élément comme un rôle ARIA invalide.
   */
  readonly roleMembre = input<string | null | undefined>(null);
  /** Diamètre en rem. */
  readonly taille = input(3);
  readonly libelle = input<string | null>(null);

  /** Repasse à faux pour chaque nouvelle photo, afin de retenter son chargement. */
  protected readonly imageInvalide = linkedSignal({ source: () => this.urlPhoto(), computation: () => false });

  protected readonly initiales = computed(() => {
    const prenom = this.prenom()?.trim();
    const nom = this.nom()?.trim() ?? '';
    const mots = prenom ? [prenom, nom] : nom.split(/\s+/);
    return mots.filter(Boolean).slice(0, 2).map((mot) => mot.charAt(0)).join('').toUpperCase();
  });
}
