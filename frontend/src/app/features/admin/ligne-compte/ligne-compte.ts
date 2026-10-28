import { DatePipe } from '@angular/common';
import { Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteAdmin, LIBELLES_ROLE_COMPTE, LIBELLES_STATUT_COMPTE, nomDuCompte } from '../../../core/services/models/admin.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { DecisionsCompte } from '../decisions-compte/decisions-compte';
import { HistoriqueCompte } from '../historique-compte/historique-compte';

/** Un compte dans une liste : l’essentiel pour décider, les décisions, et l’accès à sa fiche complète. */
@Component({
  selector: 'app-ligne-compte',
  imports: [DatePipe, RouterLink, AvatarMembre, DecisionsCompte, HistoriqueCompte],
  templateUrl: './ligne-compte.html',
  styleUrl: './ligne-compte.scss',
})
export class LigneCompte {
  private readonly authService = inject(AuthService);

  readonly compte = input.required<CompteAdmin>();
  /** Un refus, une suspension ou une réactivation est enregistré : le message dit ce qui a été fait. */
  readonly modifie = output<string>();
  /** L’administrateur valide l’inscription ; la liste l’envoie après le délai d’annulation. */
  readonly validationDemandee = output<void>();

  protected readonly libellesRole = LIBELLES_ROLE_COMPTE;
  protected readonly libellesStatut = LIBELLES_STATUT_COMPTE;
  protected readonly historiqueOuvert = signal(false);
  protected readonly estMoi = computed(() => this.compte().id === this.authService.utilisateur()?.id);
  protected readonly nomComplet = computed(() => nomDuCompte(this.compte()));
  /** Rien à montrer tant qu’aucune décision n’a été prise sur ce compte. */
  protected readonly historiqueDisponible = computed(() => this.compte().nombreDecisions > 0 || this.historiqueOuvert());
  private readonly article = viewChild.required<ElementRef<HTMLElement>>('article');

  /** Donne le focus à la ligne, annoncée par le nom du compte (après une décision sur la ligne voisine). */
  focaliser(): void {
    this.article().nativeElement.focus();
  }
}
