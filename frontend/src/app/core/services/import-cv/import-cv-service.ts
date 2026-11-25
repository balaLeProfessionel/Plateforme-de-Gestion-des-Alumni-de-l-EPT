import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { DisponibiliteImportCv, ImportCv } from '../models/import-cv.model';

// Seul point de contact avec /api/imports-cv. Sans etat : le brouillon en
// cours de relecture est tenu par BrouillonCv.
@Service()
export class ImportCvService {
  private readonly http = inject(HttpClient);

  disponibilite() {
    return this.http.get<DisponibiliteImportCv>('/api/imports-cv/disponibilite');
  }

  deposer(fichiers: readonly File[], consentement: boolean) {
    const donnees = new FormData();
    for (const fichier of fichiers) {
      donnees.append('fichiers', fichier);
    }
    donnees.append('consentement', String(consentement));
    return this.http.post<ImportCv>('/api/imports-cv', donnees);
  }

  consulter(id: string) {
    return this.http.get<ImportCv>(`/api/imports-cv/${id}`);
  }

  /** Brouillon prêt à relire, ou null s'il n'y en a pas (204). */
  courant() {
    return this.http
      .get<ImportCv>('/api/imports-cv/courant', { observe: 'response' })
      .pipe(map((reponse: HttpResponse<ImportCv>) => (reponse.status === 204 ? null : reponse.body)));
  }

  valider(id: string) {
    return this.http.patch<ImportCv>(`/api/imports-cv/${id}/valider`, null);
  }

  abandonner(id: string) {
    return this.http.patch<ImportCv>(`/api/imports-cv/${id}/abandonner`, null);
  }
}
