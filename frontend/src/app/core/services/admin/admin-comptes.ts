import { HttpClient, HttpParams } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { AuthService } from '../auth/auth-service';
import {
  ActionAdmin, ClasseEtudiante, CompteAdmin, CompteCree, CreationCompte, CriteresComptes, EntreeJournal, FicheCompte, LigneImport,
  PermissionAdmin, PromotionEtudiante, ResultatDiplomation, ResultatImport, ResultatPassage, ResumeComptes, RoleAttribuable, TableauDeBordAdmin, TypeActionAdmin,
} from '../models/admin.model';
import { Classe } from '../models/classe.model';
import { Page } from '../models/mentorat.model';

const API = '/api/admin/comptes';

/** Gestion des comptes par l’administration : inscriptions à examiner, suspensions, journal. */
@Service()
export class AdminComptesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly document = inject(DOCUMENT);

  rechercher(criteres: CriteresComptes, page: number, taille = 20) {
    let params = new HttpParams().set('page', page).set('taille', taille);
    if (criteres.recherche) params = params.set('recherche', criteres.recherche);
    if (criteres.role) params = params.set('role', criteres.role);
    if (criteres.statut) params = params.set('statut', criteres.statut);
    if (criteres.sansAnneeEntree) params = params.set('sansAnneeEntree', true);
    else if (criteres.anneeEntree) params = params.set('anneeEntree', criteres.anneeEntree);
    if (criteres.sansFiliere) params = params.set('sansFiliere', true);
    else if (criteres.filiere) params = params.set('filiere', criteres.filiere);
    if (criteres.sansClasse) params = params.set('sansClasse', true);
    else if (criteres.classe) params = params.set('classe', criteres.classe);
    return this.http.get<Page<CompteAdmin>>(API, { params });
  }

  creer(compte: CreationCompte) {
    return this.http.post<CompteCree>(API, compte);
  }

  importer(role: RoleAttribuable, lignes: readonly LigneImport[]) {
    return this.http.post<ResultatImport>(`${API}/import`, { role, lignes });
  }

  /** Classe d’un étudiant (passage en classe supérieure, correction), consignée au journal. */
  changerClasse(id: string, classe: Classe) {
    return this.http.patch<CompteAdmin>(`${API}/${encodeURIComponent(id)}/classe`, { classe });
  }

  changerRole(id: string, role: RoleAttribuable, motif: string) {
    return this.http.patch<CompteAdmin>(`${API}/${encodeURIComponent(id)}/role`, { role, motif });
  }

  /** Réservé au super administrateur : la liste remplace les responsabilités du compte. */
  modifierResponsabilites(id: string, responsabilites: readonly PermissionAdmin[]) {
    return this.http.patch<FicheCompte>(`${API}/${encodeURIComponent(id)}/responsabilites`, { responsabilites });
  }

  marquerDiplomes(ids: readonly string[], anneeSortie: number) {
    return this.http.post<ResultatDiplomation>(`${API}/diplomation`, { ids, anneeSortie });
  }

  /** Étudiants par classe et filière, pour le passage annuel. */
  classes() {
    return this.http.get<ClasseEtudiante[]>(`${API}/classes`);
  }

  /** classeDepart null : étudiants sans classe renseignée. */
  passerEnClasse(ids: readonly string[], classeDepart: Classe | null, classeArrivee: Classe) {
    return this.http.post<ResultatPassage>(`${API}/passage-classe`, { ids, classeDepart, classeArrivee });
  }

  promotions() {
    return this.http.get<PromotionEtudiante[]>(`${API}/promotions`);
  }

  fiche(id: string) {
    return this.http.get<FicheCompte>(`${API}/${encodeURIComponent(id)}`);
  }

  tableauDeBord() {
    return this.http.get<TableauDeBordAdmin>('/api/admin/tableau-de-bord');
  }

  /** Nom de l’administrateur connecté, tel qu’il apparaît comme auteur au journal. */
  modifierMonIdentite(prenom: string, nom: string) {
    return this.http.patch<void>('/api/admin/mon-compte/identite', { prenom, nom });
  }

  journal(types: readonly TypeActionAdmin[], page: number, taille = 20) {
    let params = new HttpParams().set('page', page).set('taille', taille);
    for (const type of types) params = params.append('type', type);
    return this.http.get<Page<EntreeJournal>>('/api/admin/journal', { params });
  }

  resume() {
    return this.http.get<ResumeComptes>(`${API}/resume`);
  }

  historique(id: string) {
    return this.http.get<ActionAdmin[]>(`${API}/${encodeURIComponent(id)}/historique`);
  }

  valider(id: string) {
    return this.http.patch<CompteAdmin>(`${API}/${encodeURIComponent(id)}/valider`, null);
  }

  /**
   * Validation envoyée pendant la fermeture ou le rechargement de l’onglet : une requête HttpClient serait
   * interrompue, `fetch` avec `keepalive` survit au départ de la page.
   */
  validerAuDepart(id: string): void {
    const jeton = this.authService.getToken();
    this.document.defaultView?.fetch(`${API}/${encodeURIComponent(id)}/valider`, {
      method: 'PATCH', keepalive: true, headers: jeton ? { Authorization: `Bearer ${jeton}` } : {},
    }).catch(() => {});
  }

  refuser(id: string, motif: string) {
    return this.http.patch<CompteAdmin>(`${API}/${encodeURIComponent(id)}/refuser`, { motif });
  }

  suspendre(id: string, motif: string) {
    return this.http.patch<CompteAdmin>(`${API}/${encodeURIComponent(id)}/suspendre`, { motif });
  }

  reactiver(id: string, motif: string | null) {
    return this.http.patch<CompteAdmin>(`${API}/${encodeURIComponent(id)}/reactiver`, { motif });
  }
}
