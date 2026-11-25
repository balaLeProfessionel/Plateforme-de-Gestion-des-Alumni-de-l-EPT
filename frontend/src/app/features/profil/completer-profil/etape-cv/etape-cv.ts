import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Subscription, switchMap, takeWhile, timer } from 'rxjs';
import { ImportCvService } from '../../../../core/services/import-cv/import-cv-service';
import { BrouillonCv } from '../../../../core/services/import-cv/brouillon-cv';
import { DisponibiliteImportCv, ImportCv } from '../../../../core/services/models/import-cv.model';

type Etat = 'choix' | 'envoi' | 'analyse' | 'echec';

const INTERVALLE_SUIVI_MS = 2000;
// Au-dela, on cesse d'attendre a l'ecran : le brouillon restera disponible
const ATTENTE_MAX_MS = 3 * 60 * 1000;

const TYPES_DOCUMENT = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const EXTENSIONS_DOCUMENT = /\.(pdf|docx)$/i;
const EXTENSIONS_IMAGE = /\.(jpe?g|png|webp)$/i;

function estDocument(fichier: File): boolean {
  return TYPES_DOCUMENT.includes(fichier.type) || EXTENSIONS_DOCUMENT.test(fichier.name);
}

function estImage(fichier: File): boolean {
  return fichier.type.startsWith('image/') || EXTENSIONS_IMAGE.test(fichier.name);
}

function taille(octets: number): string {
  return octets >= 1024 * 1024 ? `${(octets / (1024 * 1024)).toFixed(1)} Mo` : `${Math.ceil(octets / 1024)} Ko`;
}

// Depot du CV puis attente de l'analyse. Le fichier n'est pas conserve par
// le serveur ; le resultat sert seulement a pre-remplir les etapes suivantes.
@Component({
  selector: 'app-etape-cv',
  imports: [RouterLink],
  templateUrl: './etape-cv.html',
  styleUrl: './etape-cv.scss'
})
export class EtapeCv {
  private readonly importCv = inject(ImportCvService);
  private readonly brouillonCv = inject(BrouillonCv);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly disponibilite = signal<DisponibiliteImportCv | null>(null);
  protected readonly fichiers = signal<File[]>([]);
  protected readonly consentement = signal(false);
  protected readonly etat = signal<Etat>('choix');
  protected readonly erreur = signal<string | null>(null);
  protected readonly importEnCours = signal<ImportCv | null>(null);

  private suivi: Subscription | null = null;

  protected readonly formatsAcceptes = computed(() =>
    this.disponibilite()?.imagesAcceptees
      ? '.pdf,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp'
      : '.pdf,.docx,application/pdf'
  );

  protected readonly peutEnvoyer = computed(
    () => this.fichiers().length > 0 && this.consentement() && this.etat() === 'choix'
  );

  constructor() {
    this.importCv.disponibilite().subscribe({
      next: (disponibilite) => {
        if (!disponibilite.disponible) {
          this.router.navigate(['/completer-profil/infos'], { replaceUrl: true });
          return;
        }
        this.disponibilite.set(disponibilite);
      },
      error: () => this.erreur.set('Impossible de préparer l’import de CV. Réessayez plus tard.')
    });
  }

  protected tailleLisible(fichier: File): string {
    return taille(fichier.size);
  }

  protected choisir(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const ajoutes = Array.from(champ.files ?? []);
    // Le champ est vide apres chaque choix : on peut ajouter des captures en plusieurs fois
    champ.value = '';
    this.erreur.set(this.verifier([...this.fichiers(), ...ajoutes]));
    if (!this.erreur()) {
      this.fichiers.update((liste) => [...liste, ...ajoutes]);
    }
  }

  protected retirer(index: number): void {
    this.fichiers.update((liste) => liste.filter((_, i) => i !== index));
    this.erreur.set(null);
  }

  protected majConsentement(evenement: Event): void {
    this.consentement.set((evenement.target as HTMLInputElement).checked);
  }

  protected envoyer(): void {
    const probleme = this.verifier(this.fichiers());
    if (probleme || !this.consentement()) {
      this.erreur.set(probleme ?? 'Cochez la case d’accord pour continuer.');
      return;
    }
    this.erreur.set(null);
    this.etat.set('envoi');
    this.importCv.deposer(this.fichiers(), true).subscribe({
      next: (importCv) => {
        this.importEnCours.set(importCv);
        this.etat.set('analyse');
        this.suivre(importCv.id);
      },
      error: (err: { status?: number; error?: { message?: string } }) => {
        this.etat.set('choix');
        this.erreur.set(
          err?.status === 413
            ? 'Les fichiers sont trop lourds : 10 Mo par fichier et 30 Mo en tout.'
            : (err?.error?.message ?? 'L’envoi a échoué. Vérifiez votre connexion et réessayez.')
        );
      }
    });
  }

  protected annuler(): void {
    this.suivi?.unsubscribe();
    const importCv = this.importEnCours();
    if (importCv) {
      this.importCv.abandonner(importCv.id).subscribe({ error: () => undefined });
    }
    this.recommencer();
  }

  protected recommencer(): void {
    this.importEnCours.set(null);
    this.etat.set('choix');
    this.erreur.set(null);
  }

  protected remplirSoiMeme(): void {
    this.router.navigate(['/completer-profil/infos']);
  }

  private suivre(id: string): void {
    const debut = Date.now();
    this.suivi?.unsubscribe();
    this.suivi = timer(INTERVALLE_SUIVI_MS, INTERVALLE_SUIVI_MS)
      .pipe(
        switchMap(() => this.importCv.consulter(id)),
        takeWhile((importCv) => importCv.statut === 'EN_COURS' && Date.now() - debut < ATTENTE_MAX_MS, true),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (importCv) => this.traiter(importCv, Date.now() - debut >= ATTENTE_MAX_MS),
        error: () => {
          this.etat.set('echec');
          this.erreur.set('Le suivi de l’analyse a été interrompu. Rechargez la page pour reprendre.');
        }
      });
  }

  private traiter(importCv: ImportCv, delaiDepasse: boolean): void {
    this.importEnCours.set(importCv);
    if (importCv.statut === 'PRET') {
      this.brouillonCv.definir(importCv);
      this.router.navigate(['/completer-profil/infos']);
    } else if (importCv.statut === 'ECHEC' || importCv.statut === 'ABANDONNE') {
      this.etat.set('echec');
      this.erreur.set(importCv.message ?? 'L’analyse de votre CV n’a pas abouti.');
    } else if (delaiDepasse) {
      this.etat.set('echec');
      this.erreur.set(
        'L’analyse prend plus de temps que prévu. Revenez dans quelques minutes : elle sera reprise depuis « Complétez votre profil ».'
      );
    }
  }

  // Memes regles que le serveur, pour prevenir avant l'envoi
  private verifier(fichiers: readonly File[]): string | null {
    const disponibilite = this.disponibilite();
    if (!disponibilite || fichiers.length === 0) return null;
    const max = disponibilite.fichiersMax;
    if (fichiers.some((f) => !estDocument(f) && !estImage(f))) {
      return 'Format non accepté : déposez un PDF, un fichier Word (.docx) ou des images JPG, PNG ou WebP.';
    }
    if (fichiers.some((f) => estImage(f) && !estDocument(f)) && !disponibilite.imagesAcceptees) {
      return 'Les images ne sont pas acceptées pour le moment : déposez un PDF ou un fichier Word.';
    }
    if (fichiers.some(estDocument) && fichiers.length > 1) {
      return `Déposez un seul PDF ou fichier Word, ou jusqu’à ${max} images.`;
    }
    if (fichiers.length > max) {
      return `${max} fichiers au plus.`;
    }
    if (fichiers.some((f) => f.size > disponibilite.tailleMaxOctets)) {
      return `Chaque fichier doit faire ${taille(disponibilite.tailleMaxOctets)} au plus.`;
    }
    return null;
  }
}
