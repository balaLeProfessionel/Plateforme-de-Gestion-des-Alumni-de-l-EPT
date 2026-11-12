import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Evenement } from '../models/evenement';
import { Programme } from '../models/mentorat.model';
import { Publication } from '../publications/publication';

/** Une carte du fil personnalisé ; {@code raison} dit pourquoi elle est proposée, quand un signal personnel a joué. */
export type CarteFil =
  | { type: 'PUBLICATION'; publication: Publication; raison: string | null }
  | { type: 'EVENEMENT'; evenement: Evenement; raison: string | null }
  | { type: 'PROGRAMME'; programme: Programme; raison: string | null };

export interface PageFil {
  contenu: CarteFil[];
  page: number;
  taille: number;
  derniere: boolean;
  /** Instant du premier chargement, à renvoyer pour les pages suivantes afin de garder le même classement. */
  reference: string;
}

/** Identifiant stable d'une carte, pour le suivi des listes et le dédoublonnage entre pages. */
export function cleCarte(carte: CarteFil): string {
  switch (carte.type) {
    case 'PUBLICATION': return `p-${carte.publication.id}`;
    case 'EVENEMENT': return `e-${carte.evenement.id}`;
    case 'PROGRAMME': return `m-${carte.programme.id}`;
  }
}

@Service()
export class FilService {
  private readonly http = inject(HttpClient);

  lister(page = 0, reference: string | null = null, taille = 10) {
    let params = new HttpParams().set('page', page).set('taille', taille);
    if (reference) params = params.set('reference', reference);
    return this.http.get<PageFil>('/api/fil', { params });
  }
}
