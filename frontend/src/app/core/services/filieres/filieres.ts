import { HttpClient } from '@angular/common/http';
import { inject, Service, Signal, signal } from '@angular/core';
import { tap } from 'rxjs';
import { ChefPossible, Filiere, FiliereAdmin } from '../models/filiere.model';

const API_PUBLIQUE = '/api/public/filieres';
const API_ADMIN = '/api/admin/filieres';

/**
 * Filières de l’école (TRA-14), gérées par l’administration. La liste proposée est chargée une fois puis gardée :
 * toute modification par l’administration la recharge.
 */
@Service()
export class FilieresService {
  private readonly http = inject(HttpClient);
  private readonly liste = signal<readonly Filiere[]>([]);
  private chargee = false;

  /** Filières proposées (inscription, création de compte, filtres), triées par nom. */
  proposees(): Signal<readonly Filiere[]> {
    if (!this.chargee) this.recharger();
    return this.liste.asReadonly();
  }

  recharger(): void {
    this.chargee = true;
    this.http.get<Filiere[]>(API_PUBLIQUE).subscribe({
      next: (filieres) => this.liste.set(filieres),
      error: () => { this.chargee = false; },
    });
  }

  listerPourAdministration() {
    return this.http.get<FiliereAdmin[]>(API_ADMIN);
  }

  creer(nom: string) {
    return this.http.post<FiliereAdmin>(API_ADMIN, { nom }).pipe(tap(() => this.recharger()));
  }

  renommer(id: string, nom: string) {
    return this.http.patch<FiliereAdmin>(`${API_ADMIN}/${id}/nom`, { nom }).pipe(tap(() => this.recharger()));
  }

  changerActivite(id: string, active: boolean) {
    return this.http.patch<FiliereAdmin>(`${API_ADMIN}/${id}/${active ? 'proposer' : 'retirer'}`, {}).pipe(tap(() => this.recharger()));
  }

  /** La filière `id` disparaît ; ses comptes passent dans la cible, renvoyée. */
  fusionner(id: string, cibleId: string) {
    return this.http.post<FiliereAdmin>(`${API_ADMIN}/${id}/fusion`, { cibleId }).pipe(tap(() => this.recharger()));
  }

  chefsPossibles() {
    return this.http.get<ChefPossible[]>(`${API_ADMIN}/chefs-possibles`);
  }

  designerChef(id: string, chefId: string) {
    return this.http.put<FiliereAdmin>(`${API_ADMIN}/${id}/chef`, { chefId });
  }

  retirerChef(id: string) {
    return this.http.delete<FiliereAdmin>(`${API_ADMIN}/${id}/chef`);
  }
}
