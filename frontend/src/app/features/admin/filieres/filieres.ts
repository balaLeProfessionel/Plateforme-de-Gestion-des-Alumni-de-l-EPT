import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, OnInit, signal, viewChild } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { AuthService } from '../../../core/services/auth/auth-service';
import { FilieresService } from '../../../core/services/filieres/filieres';
import { ChefPossible, FiliereAdmin } from '../../../core/services/models/filiere.model';
import { PageAdmin } from '../page-admin/page-admin';
import { LigneFiliere } from './ligne-filiere/ligne-filiere';

/**
 * Filières de l’école (TRA-14) : l’administration (responsabilité Comptes) les ajoute, les renomme, les retire et
 * fusionne les doublons. Le super administrateur y désigne aussi les chefs de département.
 */
@Component({
  selector: 'app-filieres',
  imports: [FormField, PageAdmin, LigneFiliere],
  templateUrl: './filieres.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', './filieres.scss'],
})
export class Filieres implements OnInit {
  private readonly service = inject(FilieresService);
  private readonly injector = inject(Injector);

  protected readonly estSuper = inject(AuthService).aPermission('GERER_ADMINISTRATEURS');
  protected readonly filieres = signal<readonly FiliereAdmin[] | null>(null);
  protected readonly erreurChargement = signal(false);
  protected readonly chefsPossibles = signal<readonly ChefPossible[]>([]);
  protected readonly parents = [{ libelle: 'Comptes', lien: '/admin/comptes' }];
  protected readonly message = signal<string | null>(null);
  protected readonly actives = computed(() => (this.filieres() ?? []).filter((f) => f.active).length);

  protected readonly modele = signal({ nom: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.nom, { message: 'Indiquez le nom de la filière.' });
    maxLength(champ.nom, 120, { message: '120 caractères au maximum.' });
  });
  protected readonly enCours = signal(false);
  protected readonly erreurAjout = signal<string | null>(null);
  private readonly champNom = viewChild<ElementRef<HTMLInputElement>>('champNom');
  private readonly zoneMessage = viewChild<ElementRef<HTMLElement>>('zoneMessage');

  ngOnInit(): void {
    this.charger();
    if (this.estSuper) {
      this.service.chefsPossibles().subscribe({ next: (chefs) => this.chefsPossibles.set(chefs) });
    }
  }

  protected charger(): void {
    this.erreurChargement.set(false);
    this.service.listerPourAdministration().subscribe({
      next: (liste) => this.filieres.set(liste),
      error: () => this.erreurChargement.set(true),
    });
  }

  protected ajouter(evenement: Event): void {
    evenement.preventDefault();
    this.formulaire().markAsTouched();
    if (this.formulaire().invalid()) {
      this.champNom()?.nativeElement.focus();
      return;
    }
    this.enCours.set(true);
    this.erreurAjout.set(null);
    this.service.creer(this.modele().nom.trim()).subscribe({
      next: (creee) => {
        this.enCours.set(false);
        this.modele.set({ nom: '' });
        this.formulaire().reset();
        this.apresModification(`La filière « ${creee.nom} » est ajoutée et proposée.`);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreurAjout.set(erreur.error?.message ?? 'L’ajout a échoué. Réessayez.');
      },
    });
  }

  /** Une ligne a changé (ou disparu, après une fusion) : la liste est relue, le message annoncé. */
  protected apresModification(message: string): void {
    this.message.set(message);
    this.charger();
    afterNextRender(() => this.zoneMessage()?.nativeElement.focus(), { injector: this.injector });
  }
}
