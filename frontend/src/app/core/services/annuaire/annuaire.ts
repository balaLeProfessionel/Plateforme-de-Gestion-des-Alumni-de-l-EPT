import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { DiplomePublic, FiltresAnnuaire, PageAnnuaire } from '../models/annuaire.model';

/** Minimum exigé par la recherche publique du serveur. */
export function assezDeLettres(recherche: string): boolean {
  return (recherche.match(/\p{L}/gu) ?? []).length >= 3;
}

@Service()
export class AnnuaireService {
  private readonly http = inject(HttpClient);

  rechercher(filtres: FiltresAnnuaire) {
    let params = new HttpParams()
      .set('page', filtres.page)
      .set('taille', filtres.taille)
      .set('tri', filtres.tri);

    for (const [cle, valeur] of Object.entries({
      recherche: filtres.recherche.trim(),
      role: filtres.role === 'TOUS' ? '' : filtres.role,
      filiere: filtres.filiere,
      promotion: filtres.promotion,
      ville: filtres.ville.trim()
    })) {
      if (valeur) {
        params = params.set(cle, valeur);
      }
    }

    return this.http.get<PageAnnuaire>('/api/annuaire', { params });
  }

  rechercherPublic(recherche: string) {
    return this.http.get<DiplomePublic[]>('/api/public/annuaire', { params: { recherche } });
  }
}
