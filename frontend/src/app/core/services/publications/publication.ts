import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type { ThemeArticle } from '../articles/article';

export type TypePublication = 'PUBLICATION' | 'ANNONCE_OFFICIELLE' | 'APPEL_PROJET' | 'ARTICLE';
/** Types rédigés depuis le fil ou l’administration ; un article se rédige depuis l’espace Articles. */
export type TypePublicationRedigee = Exclude<TypePublication, 'ARTICLE'>;
export type AudiencePublication = 'TOUS' | 'ALUMNI' | 'ETUDIANTS';
export type MotifSignalement = 'SPAM' | 'CONTENU_INAPPROPRIE' | 'HARCELEMENT' | 'FAUSSE_INFORMATION' | 'AUTRE';

export const LIBELLES_TYPE_PUBLICATION: Record<TypePublication, string> = {
  PUBLICATION: 'Publication',
  ANNONCE_OFFICIELLE: 'Annonce officielle',
  APPEL_PROJET: 'Appel à projet',
  ARTICLE: 'Article',
};

export const MOTIFS_SIGNALEMENT: readonly { motif: MotifSignalement; libelle: string }[] = [
  { motif: 'SPAM', libelle: 'Spam ou publicité' },
  { motif: 'CONTENU_INAPPROPRIE', libelle: 'Contenu inapproprié' },
  { motif: 'HARCELEMENT', libelle: 'Harcèlement ou propos haineux' },
  { motif: 'FAUSSE_INFORMATION', libelle: 'Fausse information' },
  { motif: 'AUTRE', libelle: 'Autre raison' },
];

/** Décompte renvoyé quand le membre aime une publication ou retire son « J’aime ». */
export interface EtatJaime {
  nombre: number;
  jaime: boolean;
}

export interface Publication {
  id: string;
  type: TypePublication;
  titre: string | null;
  contenu: string;
  audience: AudiencePublication;
  urlImage: string | null;
  texteAlternatif: string | null;
  /** Dernier jour de réponse d’un appel à projet (AAAA-MM-JJ), inclus. */
  dateLimite: string | null;
  publieLe: string;
  auteurId: string;
  auteurNom: string | null;
  auteurPrenom: string | null;
  auteurRole: string;
  auteurPhoto: string | null;
  nombreJaime: number;
  /** Le lecteur aime cette publication. */
  jaime: boolean;
  nombreCommentaires: number;
  /** Dernier commentaire, montré sous la publication dans le fil. */
  apercuCommentaire: CommentairePublication | null;
  /** Lien partagé (publication LinkedIn, article…) avec l’aperçu lu au moment de publier. */
  lien?: LienPublication | null;
  /** Article porté par une publication de type ARTICLE : la carte du fil mène à sa page de lecture. */
  article?: ArticlePublication | null;
}

export interface ArticlePublication {
  id: string;
  theme: ThemeArticle;
  tempsLecture: number;
}

export interface LienPublication {
  url: string;
  titre: string | null;
  description: string | null;
  site: string | null;
}

export interface PagePublications {
  contenu: Publication[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}

export interface NouvellePublication {
  type: TypePublicationRedigee;
  titre: string;
  contenu: string;
  audience: AudiencePublication;
  /** Description de l’image jointe, lue par les lecteurs d’écran. */
  texteAlternatif?: string;
  /** Obligatoire pour un appel à projet, absente sinon. */
  dateLimite?: string;
  /** Lien partagé, repris de l’aperçu importé. */
  lien?: string;
}

export interface CommentairePublication {
  id: string;
  publicationId: string;
  parentId: string | null;
  auteurId: string;
  auteurNom: string | null;
  auteurPrenom: string | null;
  auteurRole: string;
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
  obtenir(id: string) {
    return this.http.get<Publication>(`/api/publications/${id}`);
  }
  lister(page = 0, taille = 6, types: readonly TypePublication[] = []) {
    let params = new HttpParams().set('page', page).set('taille', taille);
    for (const type of types) params = params.append('type', type);
    return this.http.get<PagePublications>('/api/publications', { params });
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
  /** Aimer deux fois ne compte pas double ; renvoie le nouveau décompte. */
  aimer(publicationId: string) {
    return this.http.put<EtatJaime>(`/api/publications/${publicationId}/jaime`, null);
  }
  retirerJaime(publicationId: string) {
    return this.http.delete<EtatJaime>(`/api/publications/${publicationId}/jaime`);
  }
  signaler(publicationId: string, motif: MotifSignalement, detail: string) {
    return this.http.post<void>(`/api/publications/${publicationId}/signalements`, {
      motif, ...(detail ? { detail } : {}),
    });
  }
}
