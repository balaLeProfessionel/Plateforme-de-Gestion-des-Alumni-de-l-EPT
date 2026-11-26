import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ImportCvService } from '../../../../core/services/import-cv/import-cv-service';
import { BrouillonCv } from '../../../../core/services/import-cv/brouillon-cv';

// Entree du parcours : importer son CV ou tout saisir soi-meme. Quand l'import
// n'est pas possible (role, aucun service d'IA configure), on passe
// directement a la saisie guidee.
@Component({
  selector: 'app-etape-demarrer',
  imports: [RouterLink],
  templateUrl: './etape-demarrer.html',
  styleUrl: './etape-demarrer.scss'
})
export class EtapeDemarrer {
  private readonly importCv = inject(ImportCvService);
  private readonly brouillonCv = inject(BrouillonCv);
  private readonly router = inject(Router);

  protected readonly pret = signal(false);
  protected readonly brouillonEnAttente = signal(false);

  constructor() {
    forkJoin({
      disponibilite: this.importCv.disponibilite().pipe(catchError(() => of(null))),
      brouillon: this.brouillonCv.charger()
    }).subscribe(({ disponibilite, brouillon }) => {
      if (!disponibilite?.disponible && !brouillon) {
        this.router.navigate(['/completer-profil/infos'], { replaceUrl: true });
        return;
      }
      this.brouillonEnAttente.set(Boolean(brouillon));
      this.pret.set(true);
    });
  }

  protected remplirSoiMeme(): void {
    // Choisir la saisie manuelle abandonne un brouillon non relu
    const brouillon = this.brouillonCv.import();
    if (brouillon) {
      this.importCv.abandonner(brouillon.id).subscribe({ error: () => undefined });
      this.brouillonCv.oublier();
    }
    this.router.navigate(['/completer-profil/infos']);
  }
}
