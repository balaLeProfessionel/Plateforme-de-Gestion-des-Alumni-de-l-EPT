import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RetourNavigation } from '../../../core/navigation/retour-navigation';
import { AuthService } from '../../../core/services/auth/auth-service';
import { LIBELLES_ROLE_COMPTE, RoleCompte } from '../../../core/services/models/admin.model';
import { Publication } from '../../../core/services/publications/publication';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
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
  imports: [AvatarMembre, RedactionPublication],
  template: `
    <div class="page">
      <div class="grille">
        <div class="espace">
          <app-redaction-publication [integree]="true" (publiee)="revenirAuFil($event)" (annulee)="annuler()">
            <app-avatar-membre [urlPhoto]="moi()?.urlPhoto" [nom]="moi()?.nom" [prenom]="moi()?.prenom"
              [roleMembre]="moi()?.role" [taille]="2.75" />
            <span class="identite">
              <strong>{{ nom() }}</strong>
              @if (role()) { <span class="role">{{ role() }}</span> }
            </span>
          </app-redaction-publication>
        </div>

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
    .espace { display: flex; flex-direction: column; min-width: 0; min-height: 30rem; overflow: clip;
      border: 1px solid var(--ept-border); border-radius: var(--ept-radius); background: var(--ept-surface); }
    app-redaction-publication { display: flex; flex: 1 1 auto; flex-direction: column; }
    .identite { display: grid; justify-items: start; gap: .1rem; min-width: 0; margin-right: auto; }
    .identite strong { overflow: hidden; color: var(--ept-primary-dark); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
    .role { padding: .05rem .5rem; border-radius: 999px; background: var(--ept-bg); color: var(--ept-text-secondary);
      font-size: .72rem; font-weight: 600; }
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
      .conseils { display: none; }
    }
    @media (max-width: 560px) {
      .page { padding: 0 0 6rem; }
      // Le rédacteur occupe l’écran entre l’en-tête et la barre de navigation.
      .espace { min-height: calc(100dvh - 7.75rem - env(safe-area-inset-bottom)); overflow: visible; border: 0; border-radius: 0; }
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
