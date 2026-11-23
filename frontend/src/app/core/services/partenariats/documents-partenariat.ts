import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

/** Dossier d’une convention ou d’un accord : les routes de ses documents ne diffèrent que par le préfixe. */
export type RessourcePartenariat = 'conventions' | 'accords';

/** Documents PDF des conventions et des accords, côté organisme ou côté école (`admin`). */
@Service()
export class DocumentsPartenariatService {
  private readonly http = inject(HttpClient);

  ajouter<T>(ressource: RessourcePartenariat, id: string, fichier: File, admin: boolean) {
    const contenu = new FormData();
    contenu.append('fichier', fichier);
    return this.http.post<T>(`${this.base(ressource, admin)}/${id}/pieces`, contenu);
  }

  supprimer<T>(ressource: RessourcePartenariat, id: string, pieceId: string, admin: boolean) {
    return this.http.delete<T>(`${this.base(ressource, admin)}/${id}/pieces/${pieceId}`);
  }

  /** Le PDF passe par HttpClient : la requête porte le jeton, qu’un simple lien n’enverrait pas. */
  telecharger(ressource: RessourcePartenariat, id: string, pieceId: string, admin: boolean) {
    return this.http.get(`${this.base(ressource, admin)}/${id}/pieces/${pieceId}`, { responseType: 'blob' });
  }

  private base(ressource: RessourcePartenariat, admin: boolean): string {
    return `${admin ? '/api/admin' : '/api'}/partenariats/${ressource}`;
  }
}
