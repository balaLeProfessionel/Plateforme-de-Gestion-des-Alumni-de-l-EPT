import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';

export interface Publication {
  id: string;
  type: 'PUBLICATION' | 'ANNONCE_OFFICIELLE' | 'APPEL_PROJET';
  titre: string | null;
  contenu: string;
  audience: 'TOUS' | 'ALUMNI' | 'ETUDIANTS';
  urlImage: string | null;
  publieLe: string;
  auteurId: string;
  auteurNom: string | null;
  auteurPrenom: string | null;
  auteurRole: string;
  auteurPhoto: string | null;
}

export interface PagePublications {
  contenu: Publication[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}

export interface NouvellePublication {
  type: 'PUBLICATION';
  titre: string;
  contenu: string;
  audience: 'TOUS' | 'ALUMNI' | 'ETUDIANTS';
}

@Service()
export class PublicationService {
  private readonly http = inject(HttpClient);
  creer(publication: NouvellePublication, image?: File) {
    if (!image) return this.http.post<Publication>('/api/publications', publication);
    const donnees = new FormData();
    donnees.append('publication', new Blob([JSON.stringify(publication)], { type: 'application/json' }));
    donnees.append('image', image);
    return this.http.post<Publication>('/api/publications', donnees);
  }
  lister(page = 0, taille = 6) {
    return this.http.get<PagePublications>('/api/publications', {
      params: new HttpParams().set('page', page).set('taille', taille),
    });
  }
}
