import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, ElementRef, Injector } from '@angular/core';
import { FormField, form, max, maxLength, min, submit, validate } from '@angular/forms/signals';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { MentoratService } from '../../../core/services/mentorat/mentorat';
import { DomaineMentorat, ProfilMentor } from '../../../core/services/models/mentorat.model';

const DOMAINES_MAX = 5;

interface ModeleOffre {
  disponible: boolean;
  capaciteMax: number;
  presentation: string;
  domaineIds: string[];
}

@Component({
  selector: 'app-mon-offre',
  imports: [FormField],
  templateUrl: './mon-offre.html',
  styleUrl: './mon-offre.scss',
})
export class MonOffre {
  private readonly mentoratService = inject(MentoratService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly domainesMax = DOMAINES_MAX;
  protected readonly domaines = signal<DomaineMentorat[]>([]);
  protected readonly profil = signal<ProfilMentor | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly envoiEnCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly confirmation = signal<string | null>(null);
  protected readonly modele = signal<ModeleOffre>({ disponible: true, capaciteMax: 3, presentation: '', domaineIds: [] });
  protected readonly formulaire = form(this.modele, (champ) => {
    min(champ.capaciteMax, 1, { message: 'Accompagnez au moins une personne.' });
    max(champ.capaciteMax, 10, { message: 'Au plus 10 mentorés en même temps.' });
    maxLength(champ.presentation, 600, { message: 'La présentation ne peut pas dépasser 600 caractères.' });
    validate(champ.domaineIds, ({ value }) => {
      if (value().length === 0) return { kind: 'aucun', message: 'Choisissez au moins un domaine.' };
      return value().length > DOMAINES_MAX
        ? { kind: 'trop', message: `Choisissez au plus ${DOMAINES_MAX} domaines.` }
        : undefined;
    });
  });

  constructor() {
    forkJoin({
      domaines: this.mentoratService.listerDomaines(),
      profil: this.mentoratService.obtenirMonProfil().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ domaines, profil }) => {
        this.domaines.set(domaines);
        if (profil) this.appliquerProfil(profil);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger votre offre de mentorat.');
        this.enChargement.set(false);
      },
    });
  }

  protected estChoisi(id: string): boolean {
    return this.modele().domaineIds.includes(id);
  }

  protected basculerDomaine(id: string): void {
    this.modele.update((valeurs) => ({
      ...valeurs,
      domaineIds: valeurs.domaineIds.includes(id)
        ? valeurs.domaineIds.filter((existant) => existant !== id)
        : [...valeurs.domaineIds, id],
    }));
    this.formulaire.domaineIds().markAsTouched();
  }

  protected async enregistrer(event: Event): Promise<void> {
    event.preventDefault();
    this.confirmation.set(null);
    await submit(this.formulaire, {
      onInvalid: () => focaliserPremiereErreur(this.hote.nativeElement, this.injector),
      action: async () => {
        if (this.envoiEnCours()) return undefined;
        this.envoiEnCours.set(true);
        this.messageErreur.set(null);
        try {
          const { disponible, capaciteMax, presentation, domaineIds } = this.modele();
          const profil = await firstValueFrom(this.mentoratService.enregistrerMonProfil({
            disponible, capaciteMax, domaineIds, presentation: presentation.trim() || null,
          }));
          this.appliquerProfil(profil);
          this.confirmation.set(disponible
            ? 'Votre offre est enregistrée : les membres peuvent vous solliciter.'
            : 'Votre offre est enregistrée. Vous n’apparaissez plus comme disponible.');
        } catch (erreur) {
          this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
            ? erreur.error.message
            : 'L’enregistrement a échoué. Réessayez.');
        } finally {
          this.envoiEnCours.set(false);
        }
        return undefined;
      },
    });
  }

  private appliquerProfil(profil: ProfilMentor): void {
    this.profil.set(profil);
    this.modele.set({
      disponible: profil.disponible,
      capaciteMax: profil.capaciteMax,
      presentation: profil.presentation ?? '',
      domaineIds: profil.domaines.map((domaine) => domaine.id),
    });
  }
}
