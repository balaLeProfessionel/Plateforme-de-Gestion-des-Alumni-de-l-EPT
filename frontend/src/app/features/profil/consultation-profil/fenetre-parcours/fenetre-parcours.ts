import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Experience, Formation } from '../../../../core/services/models/profil.model';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { TypeParcours } from '../frise-parcours/frise-parcours';

/** L’étape du parcours affichée dans la fenêtre. */
export interface ParcoursOuvert {
  type: TypeParcours;
  item: Experience | Formation;
}

const LIBELLES_CONTRAT: Record<Experience['typeContrat'], string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', FREELANCE: 'Freelance', FONCTION_PUBLIQUE: 'Fonction publique',
};
const LIBELLES_FORMATION: Record<Formation['typeFormation'], string> = {
  DIPLOMANTE: 'Formation diplômante', CERTIFICATION: 'Certification', SEMINAIRE: 'Séminaire', AUTRE: 'Autre formation',
};

/**
 * Détail d’une expérience ou d’une formation en fenêtre modale native, au-dessus du profil :
 * focus piégé, Échap et retour du focus gérés par le navigateur.
 */
@Component({
  selector: 'app-fenetre-parcours',
  imports: [DatePipe, NgOptimizedImage, RouterLink],
  templateUrl: './fenetre-parcours.html',
  styleUrl: './fenetre-parcours.scss',
})
export class FenetreParcours {
  private readonly profilService = inject(ProfilService);
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  /** null ferme la fenêtre. */
  readonly parcours = input<ParcoursOuvert | null>(null);
  readonly proprietaire = input(false);
  readonly aPrecedent = input(false);
  readonly aSuivant = input(false);
  readonly fermee = output<void>();
  readonly precedent = output<void>();
  readonly suivant = output<void>();
  readonly supprime = output<ParcoursOuvert>();

  protected readonly confirmationSuppression = signal(false);
  protected readonly suppressionEnCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);

  protected readonly experience = computed(() => {
    const parcours = this.parcours();
    return parcours?.type === 'experience' ? parcours.item as Experience : null;
  });
  protected readonly formation = computed(() => {
    const parcours = this.parcours();
    return parcours?.type === 'formation' ? parcours.item as Formation : null;
  });
  protected readonly titre = computed(() => this.experience()?.poste ?? this.formation()?.libelle ?? '');
  protected readonly libelleType = computed(() => {
    const experience = this.experience();
    if (experience) return LIBELLES_CONTRAT[experience.typeContrat];
    const formation = this.formation();
    return formation ? LIBELLES_FORMATION[formation.typeFormation] : '';
  });
  /** Ancre de la carte dans « Modifier mon profil ». */
  protected readonly ancreModification = computed(() => this.parcours()?.type === 'formation' ? 'formations' : 'parcours');

  constructor() {
    effect(() => {
      const parcours = this.parcours();
      const dialogue = this.dialogue().nativeElement;
      this.confirmationSuppression.set(false);
      this.messageErreur.set(null);
      if (parcours) {
        if (!dialogue.open) dialogue.showModal();
      } else if (dialogue.open) {
        dialogue.close();
      }
    });
  }

  protected fermer(): void {
    this.dialogue().nativeElement.close();
  }

  protected async supprimer(): Promise<void> {
    const parcours = this.parcours();
    if (!parcours || this.suppressionEnCours()) return;
    this.suppressionEnCours.set(true);
    this.messageErreur.set(null);
    try {
      await firstValueFrom(parcours.type === 'experience'
        ? this.profilService.supprimerExperience(parcours.item.id)
        : this.profilService.supprimerFormation(parcours.item.id));
      this.supprime.emit(parcours);
    } catch {
      this.messageErreur.set('La suppression a échoué. Réessayez.');
      this.confirmationSuppression.set(false);
    } finally {
      this.suppressionEnCours.set(false);
    }
  }
}
