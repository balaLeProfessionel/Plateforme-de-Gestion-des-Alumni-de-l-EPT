import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RetourNavigation } from '../../../core/navigation/retour-navigation';
import { AuthService } from '../../../core/services/auth/auth-service';
import { LIBELLES_ROLE_COMPTE, RoleCompte } from '../../../core/services/models/admin.model';
import { Publication } from '../../../core/services/publications/publication';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import {
  MESSAGES_SUCCES, RedactionPublication,
} from '../../../shared/publications/redaction-publication/redaction-publication';

/** État de navigation laissé au fil après une publication, pour confirmer qu’elle est en ligne. */
export interface EtatPublicationCreee {
  messagePublication?: unknown;
}

/** Espace dédié à la rédaction d’une publication, ouvert depuis l’invitation du fil d’actualité. */
@Component({
  selector: 'app-creation-publication',
  imports: [AvatarMembre, BoutonRetour, RedactionPublication],
  template: `
    <div class="page">
      <app-bouton-retour secours="/accueil" libelle="Retour au fil" />
      <div class="grille">
        <section class="espace" aria-labelledby="titre-creation">
          <header class="entete">
            <app-avatar-membre [urlPhoto]="moi()?.urlPhoto" [nom]="moi()?.nom" [prenom]="moi()?.prenom"
              [roleMembre]="moi()?.role" [taille]="3" />
            <div>
              <h1 id="titre-creation">Nouvelle publication</h1>
              <p>Publié par <strong>{{ nom() }}</strong>@if (role()) { <span class="role">{{ role() }}</span> }</p>
            </div>
          </header>
          <app-redaction-publication [integree]="true" (publiee)="revenirAuFil($event)" (annulee)="annuler()" />
        </section>

        <aside class="conseils" aria-labelledby="titre-conseils">
          <h2 id="titre-conseils"><i class="pi pi-lightbulb" aria-hidden="true"></i> Pour une publication réussie</h2>
          <ul>
            <li><strong>Allez à l’essentiel.</strong> Les cinq premières lignes s’affichent dans le fil, la suite après « Voir plus ».</li>
            <li><strong>Ajoutez une image.</strong> Elle est recadrée au format vertical 4:5 ; décrivez-la pour les lecteurs d’écran.</li>
            <li><strong>Choisissez votre public.</strong> Tous les membres, seulement les alumni ou seulement les étudiants.</li>
            <li><strong>Restez bienveillant.</strong> Chaque membre peut signaler une publication à l’administration.</li>
          </ul>
        </aside>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .page { box-sizing: border-box; max-width: 64rem; margin: 0 auto; padding: 1.5rem 2rem 6rem; }
    .grille { display: grid; grid-template-columns: minmax(0, 1fr) 18rem; align-items: start; gap: 1.5rem; }
    .espace { min-width: 0; padding: 1.5rem; border: 1px solid var(--ept-border); border-radius: var(--ept-radius);
      background: var(--ept-surface); box-shadow: 0 1px 2px rgb(1 67 101 / 6%), 0 10px 28px -18px rgb(1 67 101 / 30%); }
    .entete { display: flex; align-items: center; gap: .9rem; padding-bottom: 1.1rem; margin-bottom: .25rem;
      border-bottom: 1px solid var(--ept-border); }
    h1 { margin: 0; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.45rem; font-weight: 600; }
    .entete p { margin: .2rem 0 0; color: var(--ept-text-secondary); font-size: .9rem; }
    .entete strong { color: var(--ept-primary-dark); font-weight: 600; }
    .role { margin-left: .5rem; padding: .1rem .5rem; border-radius: 999px; background: var(--ept-primary-light);
      color: var(--ept-primary); font-size: .72rem; font-weight: 600; }
    .conseils { position: sticky; top: 5.5rem; padding: 1.1rem 1.2rem; border-radius: var(--ept-radius); background: #eef8fb;
      border: 1px solid #cdebf3; }
    .conseils h2 { display: flex; align-items: center; gap: .5rem; margin: 0 0 .75rem; color: var(--ept-primary-dark);
      font-family: var(--ept-font-heading); font-size: 1rem; font-weight: 600; }
    .conseils h2 i { color: var(--ept-primary); }
    .conseils ul { display: grid; gap: .75rem; margin: 0; padding: 0; list-style: none; }
    .conseils li { color: #2f4b5b; font-size: .88rem; line-height: 1.5; }
    .conseils strong { display: block; color: var(--ept-primary-dark); font-weight: 600; }
    @media (max-width: 900px) {
      .grille { grid-template-columns: minmax(0, 1fr); }
      .conseils { position: static; order: -1; }
      .conseils ul { gap: .5rem; }
    }
    @media (max-width: 560px) {
      .page { padding: 1rem 1rem 6rem; }
      .espace { padding: .25rem 0 0; border: 0; background: transparent; box-shadow: none; }
      h1 { font-size: 1.25rem; }
      .conseils { display: none; }
    }
  `,
})
export class CreationPublication {
  private readonly router = inject(Router);
  private readonly retour = inject(RetourNavigation);
  protected readonly moi = inject(AuthService).utilisateur;
  protected readonly nom = computed(() => `${this.moi()?.prenom ?? ''} ${this.moi()?.nom ?? ''}`.trim() || 'Vous');
  protected readonly role = computed(() => LIBELLES_ROLE_COMPTE[this.moi()?.role as RoleCompte] ?? '');

  /** La publication est en tête du fil : on y retourne avec la confirmation. */
  protected revenirAuFil(publication: Publication): void {
    const etat: EtatPublicationCreee = { messagePublication: MESSAGES_SUCCES[publication.type] };
    void this.router.navigate(['/accueil'], { state: etat });
  }

  protected annuler(): void {
    this.retour.retourner('/accueil');
  }
}
