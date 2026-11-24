import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../models/mentorat.model';
import {
  CategorieCommunaute, CommunauteAdmin, ModificationCommunaute, NouvelleCommunaute,
} from '../models/messagerie.model';

const API = '/api/admin/communautes';

export interface ResumeCommunautes {
  total: number;
  parCategorie: Record<CategorieCommunaute, number>;
}

export interface CriteresCommunautes {
  recherche: string;
  categorie: CategorieCommunaute | '';
}

/** Communautés de la messagerie dans l’administration (permission GERER_COMMUNAUTES). */
@Service()
export class AdminCommunautesService {
  private readonly http = inject(HttpClient);

  lister(criteres: CriteresCommunautes, page: number, taille = 20) {
    let params = new HttpParams().set('page', page).set('taille', taille);
    if (criteres.recherche) params = params.set('recherche', criteres.recherche);
    if (criteres.categorie) params = params.set('categorie', criteres.categorie);
    return this.http.get<Page<CommunauteAdmin>>(API, { params });
  }

  /** Nombre de communautés en tout et par catégorie, pour les filtres. */
  resume() {
    return this.http.get<ResumeCommunautes>(`${API}/resume`);
  }

  creer(communaute: NouvelleCommunaute) {
    return this.http.post<CommunauteAdmin>(API, communaute);
  }

  modifier(id: string, modification: ModificationCommunaute) {
    return this.http.patch<CommunauteAdmin>(`${API}/${id}`, modification);
  }
}
