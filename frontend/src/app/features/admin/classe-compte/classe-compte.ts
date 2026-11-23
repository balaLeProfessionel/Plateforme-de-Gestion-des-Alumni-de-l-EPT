import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { CompteAdmin, nomDuCompte } from '../../../core/services/models/admin.model';
import { Classe, CLASSES_PAR_CYCLE, LIBELLES_CLASSE, libelleClasse } from '../../../core/services/models/classe.model';

/** Classe d’un étudiant sur sa fiche : passage en classe supérieure ou correction, consigné au journal. */
@Component({
  selector: 'app-classe-compte',
  templateUrl: './classe-compte.html',
  styleUrls: ['../formulaire-admin.scss', './classe-compte.scss'],
})
export class ClasseCompte {
  private readonly service = inject(AdminComptesService);

  readonly compte = input.required<CompteAdmin>();
  readonly modifie = output<string>();

  protected readonly classesParCycle = CLASSES_PAR_CYCLE;
  protected readonly libelles = LIBELLES_CLASSE;
  protected readonly libelle = computed(() => libelleClasse(this.compte().classe));
  protected readonly ouvert = signal(false);
  protected readonly choix = signal<Classe | ''>('');
  protected readonly erreur = signal<string | null>(null);
  protected readonly enCours = signal(false);

  protected ouvrir(): void {
    this.choix.set(this.compte().classe ?? '');
    this.erreur.set(null);
    this.ouvert.set(true);
  }

  protected choisir(evenement: Event): void {
    this.choix.set((evenement.target as HTMLSelectElement).value as Classe | '');
  }

  protected enregistrer(): void {
    const classe = this.choix();
    if (!classe) {
      this.erreur.set('Choisissez la classe.');
      return;
    }
    this.enCours.set(true);
    this.erreur.set(null);
    this.service.changerClasse(this.compte().id, classe).subscribe({
      next: () => {
        this.enCours.set(false);
        this.ouvert.set(false);
        this.modifie.emit(`${nomDuCompte(this.compte())} est désormais en ${LIBELLES_CLASSE[classe]}.`);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'La classe n’a pas pu être modifiée. Réessayez.');
      },
    });
  }
}
