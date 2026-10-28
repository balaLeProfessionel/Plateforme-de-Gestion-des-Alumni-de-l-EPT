import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, Injector, signal } from '@angular/core';
import { email, form, FormField, maxLength, required, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import {
  CompteCree, LIBELLES_ROLE_COMPTE, RoleAttribuable, ROLES_ATTRIBUABLES,
} from '../../../core/services/models/admin.model';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { PageAdmin } from '../page-admin/page-admin';
import { anneeOuNull, erreurAnnee } from '../saisie-annee';

const VIERGE = { prenom: '', nom: '', email: '', role: 'ETUDIANT' as RoleAttribuable, filiere: '', anneeEntree: '', anneeSortie: '' };

/** Création d’un compte par l’administration : le mot de passe provisoire est montré une fois, et envoyé par e-mail. */
@Component({
  selector: 'app-nouveau-compte',
  imports: [FormField, RouterLink, PageAdmin],
  templateUrl: './nouveau-compte.html',
  styleUrls: ['../formulaire-admin.scss', './nouveau-compte.scss'],
})
export class NouveauCompte {
  private readonly service = inject(AdminComptesService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly roles = ROLES_ATTRIBUABLES;
  protected readonly libellesRole = LIBELLES_ROLE_COMPTE;
  protected readonly parents = [{ libelle: 'Comptes', lien: '/admin/comptes' }];
  protected readonly modele = signal({ ...VIERGE });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.prenom, { message: 'Le prénom est obligatoire.' });
    maxLength(champ.prenom, 100, { message: '100 caractères au maximum.' });
    required(champ.nom, { message: 'Le nom est obligatoire.' });
    maxLength(champ.nom, 100, { message: '100 caractères au maximum.' });
    required(champ.email, { message: 'L’adresse e-mail est obligatoire.' });
    email(champ.email, { message: 'Cette adresse e-mail n’est pas valide.' });
    maxLength(champ.filiere, 120, { message: '120 caractères au maximum.' });
    validate(champ.anneeEntree, ({ value }) => erreurAnnee(value()));
    validate(champ.anneeSortie, ({ value, valueOf }) => erreurAnnee(value(), valueOf(champ.anneeEntree)));
  });
  /** L’année de sortie n’a de sens que pour un alumni. */
  protected readonly avecSortie = computed(() => this.modele().role === 'ALUMNI');
  protected readonly enCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly cree = signal<CompteCree | null>(null);
  protected readonly copie = signal(false);

  protected async creer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    this.formulaire().markAsTouched();
    if (this.formulaire().invalid()) {
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
      return;
    }
    const saisie = this.modele();
    this.enCours.set(true);
    this.messageErreur.set(null);
    this.service.creer({
      prenom: saisie.prenom.trim(), nom: saisie.nom.trim(), email: saisie.email.trim(), role: saisie.role,
      filiere: saisie.filiere.trim() || null, anneeEntree: anneeOuNull(saisie.anneeEntree),
      anneeSortie: this.avecSortie() ? anneeOuNull(saisie.anneeSortie) : null,
    }).subscribe({
      next: (cree) => {
        this.enCours.set(false);
        this.cree.set(cree);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.messageErreur.set(erreur.error?.message ?? 'La création a échoué. Réessayez.');
      },
    });
  }

  protected async copier(motDePasse: string): Promise<void> {
    try {
      await this.document.defaultView?.navigator.clipboard.writeText(motDePasse);
      this.copie.set(true);
    } catch {
      this.copie.set(false);
    }
  }

  protected recommencer(): void {
    this.modele.set({ ...VIERGE, role: this.modele().role, filiere: this.modele().filiere, anneeEntree: this.modele().anneeEntree });
    this.formulaire().reset();
    this.cree.set(null);
    this.copie.set(false);
  }
}
