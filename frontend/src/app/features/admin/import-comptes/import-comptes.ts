import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import {
  LIBELLES_ROLE_COMPTE, ResultatImport, RoleAttribuable, ROLES_ATTRIBUABLES,
} from '../../../core/services/models/admin.model';
import { PageAdmin } from '../page-admin/page-admin';
import { LectureCsv, lireCsvComptes, MODELE_CSV } from './lecture-csv';

/** Création d’une promotion entière à partir d’un fichier CSV, avec aperçu puis rapport ligne par ligne. */
@Component({
  selector: 'app-import-comptes',
  imports: [RouterLink, PageAdmin],
  templateUrl: './import-comptes.html',
  styleUrls: ['../formulaire-admin.scss', './import-comptes.scss'],
})
export class ImportComptes {
  private readonly service = inject(AdminComptesService);
  private readonly compteur = inject(CompteurInscriptions);
  private readonly document = inject(DOCUMENT);

  protected readonly libellesRole = LIBELLES_ROLE_COMPTE;
  /** L’administration ne s’importe pas en masse : un compte admin se crée à l’unité, délibérément. */
  protected readonly roles = ROLES_ATTRIBUABLES.filter((role) => role !== 'ADMIN');
  protected readonly parents = [{ libelle: 'Comptes', lien: '/admin/comptes' }];
  protected readonly role = signal<RoleAttribuable>('ETUDIANT');
  protected readonly nomFichier = signal<string | null>(null);
  protected readonly lecture = signal<LectureCsv | null>(null);
  protected readonly aCorriger = computed(() => this.lecture()?.lignes.filter((ligne) => ligne.probleme).length ?? 0);
  protected readonly enCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly resultat = signal<ResultatImport | null>(null);

  protected async choisirFichier(champ: HTMLInputElement): Promise<void> {
    const fichier = champ.files?.[0];
    if (!fichier) return;
    this.nomFichier.set(fichier.name);
    this.lire(await fichier.text());
  }

  protected lire(texte: string): void {
    this.resultat.set(null);
    this.messageErreur.set(null);
    this.lecture.set(texte.trim() ? lireCsvComptes(texte) : null);
  }

  protected choisirRole(valeur: string): void {
    const role = this.roles.find((r) => r === valeur);
    if (role) this.role.set(role);
  }

  protected importer(): void {
    const lecture = this.lecture();
    if (!lecture?.lignes.length || this.enCours()) return;
    this.enCours.set(true);
    this.messageErreur.set(null);
    this.service.importer(this.role(), lecture.lignes.map(({ numero, probleme, ...ligne }) => ligne)).subscribe({
      next: (resultat) => {
        this.enCours.set(false);
        this.resultat.set(resultat);
        this.compteur.actualiser();
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.messageErreur.set(erreur.error?.message ?? 'L’import a échoué. Réessayez.');
      },
    });
  }

  protected nomDeLigne(numero: number): string {
    const ligne = this.lecture()?.lignes.find((l) => l.numero === numero);
    return ligne ? `${ligne.prenom} ${ligne.nom}` : '';
  }

  protected telechargerModele(): void {
    this.telecharger('modele-promotion.csv', MODELE_CSV);
  }

  /** Mots de passe provisoires des comptes créés, à transmettre si un e-mail n’arrivait pas. */
  protected telechargerMotsDePasse(): void {
    const resultat = this.resultat();
    if (!resultat) return;
    const lignes = resultat.lignes.filter((ligne) => ligne.creee).map((ligne) => {
      const source = this.lecture()?.lignes.find((l) => l.numero === ligne.numero);
      return [source?.prenom ?? '', source?.nom ?? '', ligne.email, ligne.motDePasseTemporaire ?? ''].join(';');
    });
    this.telecharger('mots-de-passe-provisoires.csv', ['prenom;nom;email;mot_de_passe_provisoire', ...lignes].join('\n') + '\n');
  }

  protected recommencer(): void {
    this.lecture.set(null);
    this.resultat.set(null);
    this.nomFichier.set(null);
  }

  private telecharger(nom: string, contenu: string): void {
    const vue = this.document.defaultView;
    if (!vue) return;
    const lien = this.document.createElement('a');
    lien.href = vue.URL.createObjectURL(new Blob(['\uFEFF' + contenu], { type: 'text/csv;charset=utf-8' }));
    lien.download = nom;
    lien.click();
    vue.URL.revokeObjectURL(lien.href);
  }
}
