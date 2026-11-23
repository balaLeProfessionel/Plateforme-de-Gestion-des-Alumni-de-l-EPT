import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CommunauteADecouvrir, estCommunauteAutomatique, ICONES_CATEGORIE, LIBELLES_CATEGORIE } from '../../../core/services/models/messagerie.model';
import { DateRelativePipe } from '../../../shared/dates/date-relative';
import { apercuConversation } from '../apercu';
import { AvatarGroupe } from '../avatar-groupe';
import { EtatCommunautes } from '../etat-communautes';
import { messageServeur } from '../message-erreur';

const LONGUEUR_MAX_RECHERCHE_COMMUNAUTES = 100;

/** Minuscules sans accents, pour comparer « Thiès » et « thies ». */
function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Chaque mot cherché doit se trouver dans l’un des textes (nom, catégorie, description). */
function correspond(termes: readonly string[], ...textes: (string | null | undefined)[]): boolean {
  if (termes.length === 0) return true;
  const contenu = normaliser(textes.filter(Boolean).join(' '));
  return termes.every((terme) => contenu.includes(terme));
}

/**
 * Onglet « Communautés » : celles dont je fais partie (promo, filière, puis celles que j’ai rejointes),
 * et celles que je peux rejoindre, avec le nombre de membres de ma promo qui y sont déjà.
 */
@Component({
  selector: 'app-liste-communautes',
  imports: [FormField, RouterLink, RouterLinkActive, AvatarGroupe, DateRelativePipe],
  templateUrl: './liste-communautes.html',
  styleUrl: './liste-communautes.scss',
})
export class ListeCommunautes {
  protected readonly etat = inject(EtatCommunautes);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly libelles = LIBELLES_CATEGORIE;
  protected readonly icones = ICONES_CATEGORIE;

  /** Communauté en train d’être rejointe, et l’erreur éventuelle de la dernière tentative. */
  protected readonly enCours = signal<string | null>(null);
  protected readonly erreurRejoindre = signal<{ id: string; message: string } | null>(null);

  protected readonly modele = signal({ recherche: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    maxLength(champ.recherche, LONGUEUR_MAX_RECHERCHE_COMMUNAUTES);
  });
  /** Ce qui est cherché ; la comparaison ignore accents et majuscules (« thies » trouve « Thiès »). */
  protected readonly recherche = computed(() => this.modele().recherche.trim());
  private readonly termes = computed(() => normaliser(this.recherche()).split(/\s+/).filter(Boolean));

  private readonly toutesLesLignes = computed(() => {
    const moi = this.authService.utilisateur()?.id;
    return this.etat.miennes().map((conversation) => {
      const nombre = conversation.nombreParticipants;
      const nature = conversation.categorie ? LIBELLES_CATEGORIE[conversation.categorie] : 'Communauté';
      // Tant que personne n’a écrit (au plus des arrivées et des départs), la ligne présente la communauté :
      // « Promo · 11 membres » dit plus qu’un « Vous avez rejoint la com… » coupé.
      const ecrit = conversation.dernierMessage && !conversation.dernierMessage.systeme;
      return {
        conversation,
        nature,
        apercu: ecrit ? apercuConversation(conversation, moi) : `${nature} · ${nombre} membre${nombre > 1 ? 's' : ''}`,
        presentation: !ecrit,
        nonLus: conversation.nombreNonLus > 99 ? '99+' : String(conversation.nombreNonLus),
      };
    });
  });

  /** Mes communautés, filtrées par nom et par catégorie (« promo », « ville »…). */
  protected readonly lignes = computed(() => this.toutesLesLignes().filter((ligne) =>
    correspond(this.termes(), ligne.conversation.nom, ligne.nature)));
  /** À découvrir, filtrées aussi sur la description (« afterwork », « solaire »…). */
  protected readonly decouvertes = computed(() => this.etat.aDecouvrir().filter((communaute) =>
    correspond(this.termes(), communaute.nom, LIBELLES_CATEGORIE[communaute.categorie], communaute.description)));
  /** Le champ apparaît dès qu’il y a de quoi chercher, et reste tant qu’une recherche est saisie. */
  protected readonly rechercheVisible = computed(() =>
    this.toutesLesLignes().length + this.etat.aDecouvrir().length > 0 || this.recherche() !== '');
  protected readonly aucunResultat = computed(() =>
    this.recherche() !== '' && this.lignes().length === 0 && this.decouvertes().length === 0);
  /** Résultat annoncé aux lecteurs d’écran. */
  protected readonly statutRecherche = computed(() => {
    if (!this.recherche()) return '';
    const total = this.lignes().length + this.decouvertes().length;
    return total === 0 ? 'Aucune communauté trouvée.'
      : `${total} communauté${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}.`;
  });

  protected effacerRecherche(): void {
    this.modele.set({ recherche: '' });
    this.hote.nativeElement.querySelector<HTMLInputElement>('#recherche-communautes')?.focus();
  }

  protected estAutomatique(communaute: CommunauteADecouvrir): boolean {
    return estCommunauteAutomatique(communaute.categorie);
  }

  /** Membres de ma promo, à mettre en avant ; rien dans une communauté de promo, où tous en sont. */
  protected deMaPromo(communaute: CommunauteADecouvrir): number {
    const toutesDeLaPromo = communaute.categorie === 'PROMO' || communaute.categorie === 'PROMO_FILIERE';
    return toutesDeLaPromo ? 0 : communaute.membresDeMaPromo;
  }

  /** Nombre total de membres ; ceux de ma promo sont mis en avant à part dans le gabarit. */
  protected membres(communaute: CommunauteADecouvrir): string {
    return `${communaute.nombreMembres} membre${communaute.nombreMembres > 1 ? 's' : ''}`;
  }

  protected rejoindre(communaute: CommunauteADecouvrir): void {
    if (this.enCours()) return;
    this.enCours.set(communaute.id);
    this.erreurRejoindre.set(null);
    this.etat.rejoindre(communaute.id).subscribe({
      next: (detail) => {
        this.enCours.set(null);
        void this.router.navigate(['/messagerie', detail.id]);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(null);
        this.erreurRejoindre.set({
          id: communaute.id,
          message: messageServeur(erreur, 'Impossible de rejoindre cette communauté. Réessayez.'),
        });
      },
    });
  }
}
