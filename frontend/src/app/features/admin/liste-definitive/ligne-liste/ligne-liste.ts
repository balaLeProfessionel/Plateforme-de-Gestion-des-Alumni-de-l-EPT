import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LIBELLES_AVIS_ORGANISME, LIBELLES_STATUT_STAGE, LigneListe, ListeDefinitive, LONGUEUR_MOTIF_STAGE,
} from '../../../../core/services/models/stage.model';
import { libelleClasse } from '../../../../core/services/models/classe.model';
import { ListeDefinitiveService } from '../../../../core/services/stages/liste-definitive';
import { AvatarMembre } from '../../../../shared/images/avatar-membre';

type Mode = 'lecture' | 'dates' | 'retrait';

/**
 * Une ligne de la liste définitive : l’étudiant, sa candidature et l’avis de l’organisme, les dates du stage
 * (modifiables), le retrait (direct en brouillon, avec motif après publication).
 */
@Component({
  selector: 'app-ligne-liste',
  imports: [DatePipe, RouterLink, AvatarMembre],
  templateUrl: './ligne-liste.html',
  styleUrls: ['../../formulaire-admin.scss', './ligne-liste.scss'],
  host: { '[class.annulee]': 'annule()' },
})
export class LigneListeDefinitive {
  private readonly service = inject(ListeDefinitiveService);

  readonly ligne = input.required<LigneListe>();
  readonly modifie = output<ListeDefinitive>();

  protected readonly statuts = LIBELLES_STATUT_STAGE;
  protected readonly libelleClasse = libelleClasse;
  protected readonly avis = LIBELLES_AVIS_ORGANISME;
  protected readonly longueurMotif = LONGUEUR_MOTIF_STAGE;
  protected readonly mode = signal<Mode>('lecture');
  protected readonly debut = signal('');
  protected readonly fin = signal('');
  protected readonly motif = signal('');
  protected readonly erreur = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly confirme = computed(() => this.ligne().statut === 'CONFIRME');
  protected readonly annule = computed(() => this.ligne().statut === 'ANNULE');
  protected readonly nom = computed(() => `${this.ligne().etudiant.prenom} ${this.ligne().etudiant.nom}`);

  protected ouvrir(mode: Mode): void {
    this.erreur.set(null);
    this.debut.set(this.ligne().dateDebut ?? '');
    this.fin.set(this.ligne().dateFin ?? '');
    this.motif.set('');
    this.mode.set(mode);
  }

  protected saisir(champ: 'debut' | 'fin' | 'motif', evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement | HTMLTextAreaElement).value;
    (champ === 'debut' ? this.debut : champ === 'fin' ? this.fin : this.motif).set(valeur);
  }

  protected enregistrerDates(): void {
    if (!this.debut() || !this.fin()) {
      this.erreur.set('Renseignez le début et la fin du stage.');
      return;
    }
    if (this.fin() < this.debut()) {
      this.erreur.set('La fin du stage ne peut pas précéder son début.');
      return;
    }
    this.executer(this.service.modifierDates(this.ligne().id, this.debut(), this.fin()));
  }

  protected retirer(): void {
    if (this.confirme() && !this.motif().trim()) {
      this.erreur.set('Indiquez le motif : l’étudiant et l’organisme le recevront.');
      return;
    }
    this.executer(this.service.retirer(this.ligne().id, this.confirme() ? this.motif().trim() : null));
  }

  private executer(requete: ReturnType<ListeDefinitiveService['retirer']>): void {
    this.enCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (liste) => {
        this.enCours.set(false);
        this.mode.set('lecture');
        this.modifie.emit(liste);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’action n’a pas abouti. Réessayez.');
      },
    });
  }
}
