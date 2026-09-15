import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { FiltresAnnuaire, PageAnnuaire } from '../models/annuaire.model';

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
      role: filtres.role,
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
}
