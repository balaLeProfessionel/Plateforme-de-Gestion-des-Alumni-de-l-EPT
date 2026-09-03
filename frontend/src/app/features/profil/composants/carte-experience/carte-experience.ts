import { Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { InputText } from 'primeng/inputtext';
import { TYPES_CONTRAT } from '../../../../core/data/types-contrat';
import {
  Experience,
  ExperienceRequest,
  LienOrganisme,
  TypeContrat
} from '../../../../core/services/models/profil.model';
import { OrganismeSuggestion } from '../../../../core/services/models/organisme.model';
import { MessageSection } from '../message-section.model';
import { AutocompleteOrganisme } from '../autocomplete-organisme/autocomplete-organisme';

// Modele du formulaire : le type de contrat vaut '' tant que rien n'est
// choisi, ce que le type TypeContrat n'autorise pas a lui seul.
interface ModeleExperience {
  poste: string;
  typeContrat: TypeContrat | '';
  dateDebut: string;
  dateFin: string;
  enCours: boolean;
  estStage: boolean;
}

function versModele(experience: Experience | null): ModeleExperience {
  if (!experience) {
    return {
      poste: '',
      typeContrat: '',
      dateDebut: '',
      dateFin: '',
      enCours: false,
      estStage: false
    };
  }
  return {
    poste: experience.poste,
    typeContrat: experience.typeContrat,
    dateDebut: experience.dateDebut,
    dateFin: experience.dateFin ?? '',
    enCours: experience.dateFin === null,
    estStage: experience.estStage
  };
}

// Edite UNE experience professionnelle. Aucun appel reseau : la carte emet
// (enregistrer) et (supprimer), la page s'occupe du service.
@Component({
  selector: 'app-carte-experience',
  imports: [FormField, InputText, AutocompleteOrganisme],
  templateUrl: './carte-experience.html',
  styleUrl: './carte-experience.scss'
})
export class CarteExperience {
  // Cle unique de la carte : sert aux identifiants ARIA de l'autocomplete
  readonly cle = input.required<string>();
  // null : carte vierge, pas encore enregistree
  readonly experience = input<Experience | null>(null);

  readonly suggestions = input<OrganismeSuggestion[]>([]);
  readonly enRecherche = input(false);
  readonly enSauvegarde = input(false);
  readonly message = input<MessageSection | null>(null);

  readonly rechercherOrganisme = output<string>();
  readonly enregistrer = output<ExperienceRequest>();
  readonly supprimer = output<void>();
  readonly abandonner = output<void>();

  protected readonly typesContrat = TYPES_CONTRAT;

  protected readonly modele = linkedSignal(() => versModele(this.experience()));

  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.poste, { message: 'Le poste est obligatoire' });
    required(champ.typeContrat, { message: 'Le type de contrat est obligatoire' });
    required(champ.dateDebut, { message: 'La date de debut est obligatoire' });
    // Une experience toujours en cours n'a pas de date de fin a saisir
    disabled(champ.dateFin, ({ valueOf }) => valueOf(champ.enCours));
  });

  // L'organisme vit hors du formulaire : il ne se saisit pas au clavier dans
  // un champ simple mais se choisit dans l'autocomplete, qui emet deja le
  // format attendu par le backend.
  protected readonly lien = linkedSignal<LienOrganisme>(() => {
    const experience = this.experience();
    return experience ? { organismeId: experience.organismeId } : {};
  });

  protected readonly nomOrganismeInitial = computed(() => this.experience()?.nomOrganisme ?? '');

  protected readonly organismeManquant = signal(false);
  // Confirmation en deux temps, plutot qu'une boite de dialogue native
  protected readonly confirmeSuppression = signal(false);

  protected readonly estNouvelle = computed(() => this.experience() === null);

  protected majLien(lien: LienOrganisme): void {
    this.lien.set(lien);
    if (lien.organismeId || lien.nomNouvelOrganisme) {
      this.organismeManquant.set(false);
    }
  }

  protected valider(): void {
    const lien = this.lien();
    const organismeRenseigne = Boolean(lien.organismeId ?? lien.nomNouvelOrganisme);
    this.organismeManquant.set(!organismeRenseigne);

    if (this.formulaire().invalid() || !organismeRenseigne) {
      return;
    }

    const m = this.modele();
    this.enregistrer.emit({
      poste: m.poste.trim(),
      typeContrat: m.typeContrat as TypeContrat,
      dateDebut: m.dateDebut,
      // Une experience en cours n'a pas de date de fin
      dateFin: m.enCours ? null : m.dateFin || null,
      estStage: m.estStage,
      ...lien
    });
  }

  protected demanderSuppression(): void {
    this.confirmeSuppression.set(true);
  }

  protected annulerSuppression(): void {
    this.confirmeSuppression.set(false);
  }

  protected confirmerSuppression(): void {
    this.confirmeSuppression.set(false);
    this.supprimer.emit();
  }
}
