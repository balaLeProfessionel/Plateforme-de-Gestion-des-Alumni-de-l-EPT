import { Component, computed, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { RetourNavigation } from '../../../core/navigation/retour-navigation';
import { AuthService } from '../../../core/services/auth/auth-service';
import { LIBELLES_ROLE_COMPTE, RoleCompte } from '../../../core/services/models/admin.model';
import { Publication } from '../../../core/services/publications/publication';
import { BarreCreation } from '../../../shared/creation/barre-creation';
import { Conseil, ConseilsCreation } from '../../../shared/creation/conseils-creation';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import {
  MESSAGES_SUCCES, RedactionPublication,
} from '../../../shared/publications/redaction-publication/redaction-publication';

/** État de navigation laissé au fil après une publication, pour confirmer qu’elle est en ligne. */
export interface EtatPublicationCreee {
  messagePublication?: unknown;
}

const CONSEILS: readonly Conseil[] = [
  { titre: 'Allez à l’essentiel.', texte: 'Les cinq premières lignes s’affichent dans le fil, la suite après « Voir plus ».' },
  { titre: 'Ajoutez une image.', texte: 'Elle est recadrée au format vertical 4:5.' },
  { titre: 'Choisissez votre public.', texte: 'Tous les membres, seulement les alumni ou seulement les étudiants.' },
  { titre: 'Restez bienveillant.', texte: 'Chaque membre peut signaler une publication à l’administration.' },
];

/** Espace dédié à la rédaction d’une publication, ouvert depuis l’invitation du fil d’actualité. */
@Component({
  selector: 'app-creation-publication',
  imports: [AvatarMembre, BarreCreation, ConseilsCreation, RedactionPublication],
  template: `
    <app-barre-creation [titre]="redaction()?.titreFormulaire() ?? 'Nouvelle publication'"
      libelleFermer="Annuler et revenir au fil" formulaire="formulaire-publication"
      [enCours]="redaction()?.enCours() ?? false" (fermer)="annuler()" />
    <div class="page">
      <div class="espace">
        <app-redaction-publication [integree]="true" idFormulaire="formulaire-publication"
          (publiee)="revenirAuFil($event)" (annulee)="annuler()">
          <app-avatar-membre [urlPhoto]="moi()?.urlPhoto" [nom]="moi()?.nom" [prenom]="moi()?.prenom"
            [roleMembre]="moi()?.role" [taille]="2.75" />
          <span class="identite">
            <strong>{{ nom() }}</strong>
            @if (role()) { <span class="role">{{ role() }}</span> }
          </span>
        </app-redaction-publication>
      </div>
      <app-conseils-creation titre="Pour une publication réussie" [conseils]="conseils" />
    </div>
  `,
  styles: `
    :host { display: block; }
    .page { box-sizing: border-box; display: grid; grid-template-columns: minmax(0, 1fr) 18rem; align-items: start; gap: 1.5rem;
      max-width: 64rem; margin: 0 auto; padding: 1.5rem 2rem 6rem; }
    .espace { display: flex; flex-direction: column; min-width: 0; min-height: 30rem; overflow: clip;
      border: 1px solid var(--ept-border); border-radius: var(--ept-radius); background: var(--ept-surface); }
    app-redaction-publication { display: flex; flex: 1 1 auto; flex-direction: column; }
    // L’avatar occupe deux lignes : le nom et le rôle, puis la pastille du public juste en dessous.
    app-avatar-membre { grid-row: span 2; align-self: start; }
    .identite { display: grid; grid-column: 2; justify-items: start; gap: .1rem; min-width: 0; }
    .identite strong { overflow: hidden; color: var(--ept-primary-dark); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
    .role { padding: .05rem .5rem; border-radius: 999px; background: var(--ept-bg); color: var(--ept-text-secondary);
      font-size: .72rem; font-weight: 600; }
    @media (max-width: 900px) { .page { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 560px) {
      .page { padding: 0 0 6rem; }
      // Le rédacteur occupe l’écran entre la barre de création et la barre de navigation.
      .espace { min-height: calc(100dvh - 11rem - env(safe-area-inset-bottom)); overflow: visible; border: 0; border-radius: 0; }
    }
  `,
})
export class CreationPublication {
  private readonly router = inject(Router);
  private readonly retour = inject(RetourNavigation);
  protected readonly redaction = viewChild(RedactionPublication);
  protected readonly conseils = CONSEILS;
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
