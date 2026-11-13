import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { AudiencePublication } from '../publications/publication';

export type ThemeArticle = 'PARCOURS' | 'CARRIERE' | 'ENTREPRENEURIAT' | 'RECHERCHE' | 'VIE_ECOLE';
export type StatutArticle = 'BROUILLON' | 'PUBLIE';

export const LIBELLES_THEME: Record<ThemeArticle, string> = {
  PARCOURS: 'Parcours',
  CARRIERE: 'Carrière',
  ENTREPRENEURIAT: 'Entrepreneuriat',
  RECHERCHE: 'Recherche',
  VIE_ECOLE: 'Vie de l’école',
};

export const THEMES_ARTICLE = Object.keys(LIBELLES_THEME) as ThemeArticle[];

/** Limites identiques au serveur (`ArticleRequest`). */
export const LIMITES_ARTICLE = { titre: 160, resume: 300, contenu: 40000 } as const;

/** Article complet ; `publicationId` porte les « J’aime », commentaires et signalements (absent d’un brouillon). */
export interface Article {
  id: string;
  publicationId: string | null;
  titre: string;
  resume: string | null;
  contenu: string;
  theme: ThemeArticle;
  urlCouverture: string | null;
  tempsLecture: number;
  audience: AudiencePublication;
  statut: StatutArticle;
  creeLe: string;
  modifieLe: string;
  publieLe: string | null;
  auteurId: string;
  auteurNom: string | null;
  auteurPrenom: string | null;
  auteurRole: string;
  auteurPhoto: string | null;
  /** Fiche de l’organisme quand l’auteur est un compte organisme (lien vers /organismes/:id). */
  auteurOrganismeId?: string | null;
  estAuteur: boolean;
  nombreJaime: number;
  jaime: boolean;
  nombreCommentaires: number;
}

/** Article dans une liste, sans le corps. */
export interface ResumeArticle {
  id: string;
  publicationId: string | null;
  titre: string;
  resume: string | null;
  theme: ThemeArticle;
  urlCouverture: string | null;
  tempsLecture: number;
  statut: StatutArticle;
  modifieLe: string;
  publieLe: string | null;
  auteurId: string;
  auteurNom: string | null;
  auteurPrenom: string | null;
  auteurRole: string;
  auteurPhoto: string | null;
  /** Fiche de l’organisme quand l’auteur est un compte organisme (lien vers /organismes/:id). */
  auteurOrganismeId?: string | null;
}

export interface PageArticles {
  contenu: ResumeArticle[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}

export interface DemandeArticle {
  titre: string;
  resume: string | null;
  contenu: string;
  theme: ThemeArticle;
  audience: AudiencePublication;
}

export interface CriteresArticles {
  theme: ThemeArticle | null;
  recherche: string;
  page: number;
}

@Service()
export class ArticleService {
  private readonly http = inject(HttpClient);

  lister(criteres: CriteresArticles, taille = 12) {
    let params = new HttpParams().set('page', criteres.page).set('taille', taille);
    if (criteres.theme) params = params.set('theme', criteres.theme);
    if (criteres.recherche) params = params.set('recherche', criteres.recherche);
    return this.http.get<PageArticles>('/api/articles', { params });
  }
  miens(page = 0, taille = 12) {
    return this.http.get<PageArticles>('/api/articles/miens', { params: new HttpParams().set('page', page).set('taille', taille) });
  }
  obtenir(id: string) {
    return this.http.get<Article>(`/api/articles/${encodeURIComponent(id)}`);
  }
  creer(demande: DemandeArticle, couverture?: File) {
    if (!couverture) return this.http.post<Article>('/api/articles', demande);
    const donnees = new FormData();
    donnees.append('article', new Blob([JSON.stringify(demande)], { type: 'application/json' }));
    donnees.append('couverture', couverture);
    return this.http.post<Article>('/api/articles', donnees);
  }
  modifier(id: string, demande: DemandeArticle) {
    return this.http.put<Article>(`/api/articles/${encodeURIComponent(id)}`, demande);
  }
  publier(id: string) {
    return this.http.patch<Article>(`/api/articles/${encodeURIComponent(id)}/publier`, null);
  }
  supprimer(id: string) {
    return this.http.delete<void>(`/api/articles/${encodeURIComponent(id)}`);
  }
  changerCouverture(id: string, couverture: File) {
    const donnees = new FormData();
    donnees.append('couverture', couverture);
    return this.http.put<Article>(`/api/articles/${encodeURIComponent(id)}/couverture`, donnees);
  }
  retirerCouverture(id: string) {
    return this.http.delete<Article>(`/api/articles/${encodeURIComponent(id)}/couverture`);
  }
}
