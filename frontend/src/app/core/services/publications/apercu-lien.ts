import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';

/** Ce que la page liée dit d’elle-même ; titre, description et image peuvent manquer (LinkedIn bloque souvent). */
export interface ApercuLien {
  url: string;
  titre: string | null;
  description: string | null;
  image: string | null;
  site: string | null;
}

export function apercuLisible(apercu: ApercuLien): boolean {
  return !!(apercu.titre || apercu.description);
}

/** Lien LinkedIn, y compris ses liens courts « lnkd.in » partagés depuis l’application. */
export function estLinkedin(url: string | null | undefined, site?: string | null): boolean {
  return /^https?:\/\/([\w-]+\.)*(linkedin\.com|lnkd\.in)(\/|$)/i.test(url ?? '') || site?.trim().toLowerCase() === 'linkedin';
}

@Service()
export class ApercuLienService {
  private readonly http = inject(HttpClient);

  lire(url: string) {
    return this.http.post<ApercuLien>('/api/apercus-lien', { url });
  }

  /** L’image de l’aperçu, relayée par le serveur pour pouvoir être recadrée comme une image choisie. */
  image(url: string) {
    return this.http.get('/api/apercus-lien/image', { params: new HttpParams().set('url', url), responseType: 'blob' });
  }
}
