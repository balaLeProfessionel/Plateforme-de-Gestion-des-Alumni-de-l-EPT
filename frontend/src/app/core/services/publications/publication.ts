import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';

export interface Publication {
  id: string;
  type: 'PUBLICATION' | 'ANNONCE_OFFICIELLE' | 'APPEL_PROJET';
  titre: string | null;
  contenu: string;
  audience: 'TOUS' | 'ALUMNI' | 'ETUDIANTS';
  urlImage: string | null;
  texteAlternatif: string | null;
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
  /** Description de l’image jointe, lue par les lecteurs d’écran. */
  texteAlternatif?: string;
}

export interface CommentairePublication {
  id: string;
  publicationId: string;
  parentId: string | null;
  auteurId: string;
  auteurNom: string | null;
  auteurPrenom: string | null;
  auteurPhoto: string | null;
  contenu: string;
  creeLe: string;
}

export interface PageCommentairesPublication {
  contenu: CommentairePublication[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
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
  listerCommentaires(publicationId: string, page = 0, taille = 20) {
    return this.http.get<PageCommentairesPublication>(`/api/publications/${publicationId}/commentaires`, {
      params: new HttpParams().set('page', page).set('taille', taille),
    });
  }
  commenter(publicationId: string, contenu: string, parentId?: string) {
    return this.http.post<CommentairePublication>(`/api/publications/${publicationId}/commentaires`, {
      contenu, ...(parentId ? { parentId } : {}),
    });
  }
}
