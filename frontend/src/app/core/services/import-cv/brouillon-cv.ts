import { computed, inject, Service, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { ImportCv } from '../models/import-cv.model';
import { ImportCvService } from './import-cv-service';

// Brouillon issu d'un CV, partage par les etapes du parcours « Completez
// votre profil » : chacune y lit ce qui la concerne pour pre-remplir ses
// champs. Il est recharge depuis le serveur apres un rafraichissement de page.
@Service()
export class BrouillonCv {
  private readonly importCv = inject(ImportCvService);

  private readonly courant = signal<ImportCv | null>(null);
  private chargement: Observable<ImportCv | null> | null = null;

  readonly import = this.courant.asReadonly();
  readonly profil = computed(() => this.courant()?.profil ?? null);

  definir(importCv: ImportCv): void {
    this.courant.set(importCv.statut === 'PRET' ? importCv : null);
  }

  /** Charge le brouillon en attente de relecture, une seule fois par session. */
  charger(): Observable<ImportCv | null> {
    if (this.courant()) {
      return of(this.courant());
    }
    this.chargement ??= this.importCv.courant().pipe(
      tap((importCv) => {
        if (importCv) this.definir(importCv);
      }),
      catchError(() => of(null))
    );
    return this.chargement;
  }

  /** Le profil est enregistre : le serveur efface le brouillon. */
  valider(): Observable<unknown> {
    const importCv = this.courant();
    this.oublier();
    return importCv ? this.importCv.valider(importCv.id).pipe(catchError(() => of(null))) : of(null);
  }

  oublier(): void {
    this.courant.set(null);
    this.chargement = null;
  }
}
