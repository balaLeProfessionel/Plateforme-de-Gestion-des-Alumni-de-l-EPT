import { Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { disabled, form, FormField, maxLength, required } from '@angular/forms/signals';
import { InputText } from 'primeng/inputtext';
import { TYPES_FORMATION } from '../../../../core/data/types-formation';
import {
  Formation,
  FormationRequest,
  LienOrganisme,
  TypeFormation
} from '../../../../core/services/models/profil.model';
import { OrganismeSuggestion } from '../../../../core/services/models/organisme.model';
import { MessageSection } from '../message-section.model';
import { ModeEnregistrement, ResultatCollecte } from '../demande-enregistrement.model';
import { AutocompleteOrganisme } from '../autocomplete-organisme/autocomplete-organisme';

// Modele du formulaire : le type vaut '' tant que rien n'est choisi, ce que
// le type TypeFormation n'autorise pas a lui seul.
interface ModeleFormation {
  libelle: string;
  description: string;
  typeFormation: TypeFormation | '';
  dateDebut: string;
  dateFin: string;
  enCours: boolean;
  estStage: boolean;
}

function versModele(formation: Formation | null): ModeleFormation {
  if (!formation) {
    return {
      libelle: '',
      description: '',
      typeFormation: '',
      dateDebut: '',
      dateFin: '',
      enCours: false,
      estStage: false
    };
  }
  return {
    libelle: formation.libelle,
    description: formation.description ?? '',
    typeFormation: formation.typeFormation,
    dateDebut: formation.dateDebut,
    dateFin: formation.dateFin ?? '',
    enCours: formation.dateFin === null,
    estStage: formation.estStage
  };
}

function versLien(formation: Formation | null): LienOrganisme {
  return formation ? { organismeId: formation.organismeId } : {};
}

// Edite UNE formation. Aucun appel reseau : la carte emet (enregistrer) et
// (supprimer), la page s'occupe du service.
@Component({
  selector: 'app-carte-formation',
  imports: [FormField, InputText, AutocompleteOrganisme],
  templateUrl: './carte-formation.html',
  styleUrl: './carte-formation.scss'
})
export class CarteFormation {
  // Cle unique de la carte : sert aux identifiants ARIA de l'autocomplete
  readonly cle = input.required<string>();
  // null : carte vierge, pas encore enregistree
  readonly formation = input<Formation | null>(null);

  // En mode global, la carte n'affiche pas son propre bouton d'enregistrement :
  // c'est la liste qui collecte toutes les cartes d'un coup.
  readonly modeEnregistrement = input<ModeEnregistrement>('parCarte');

  readonly suggestions = input<OrganismeSuggestion[]>([]);
  readonly enRecherche = input(false);
  readonly enSauvegarde = input(false);
  readonly message = input<MessageSection | null>(null);

  readonly rechercherOrganisme = output<string>();
  readonly enregistrer = output<FormationRequest>();
  readonly supprimer = output<void>();
  readonly abandonner = output<void>();

  protected readonly typesFormation = TYPES_FORMATION;

  protected readonly modele = linkedSignal(() => versModele(this.formation()));

  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.libelle, { message: 'L’intitulé est obligatoire' });
    maxLength(champ.libelle, 255, { message: 'L’intitulé ne peut pas dépasser 255 caractères' });
    maxLength(champ.description, 2000, { message: 'La description ne peut pas dépasser 2 000 caractères' });
    required(champ.typeFormation, { message: 'Le type de formation est obligatoire' });
    required(champ.dateDebut, { message: 'La date de début est obligatoire' });
    // Une formation toujours en cours n'a pas de date de fin a saisir
    disabled(champ.dateFin, ({ valueOf }) => valueOf(champ.enCours));
  });

  // L'organisme vit hors du formulaire : il se choisit dans l'autocomplete,
  // qui emet deja le format attendu par le backend.
  protected readonly lien = linkedSignal<LienOrganisme>(() => versLien(this.formation()));

  protected readonly nomOrganismeInitial = computed(() => this.formation()?.nomOrganisme ?? '');

  protected readonly organismeManquant = signal(false);
  protected readonly datesInvalides = signal(false);
  // Une tentative d'enregistrement a eu lieu : les erreurs s'affichent alors
  // meme sur les champs que l'utilisateur n'a jamais visites.
  protected readonly soumis = signal(false);
  // Confirmation en deux temps, plutot qu'une boite de dialogue native
  protected readonly confirmeSuppression = signal(false);

  protected readonly estNouvelle = computed(() => this.formation() === null);

  // Empreinte de l'etat initial, pour ne pas rejouer une requete sur une
  // carte que l'utilisateur n'a pas touchee.
  private readonly empreinteInitiale = computed(() =>
    this.empreinte(versModele(this.formation()), versLien(this.formation()))
  );

  protected readonly estModifiee = computed(
    () => this.empreinte(this.modele(), this.lien()) !== this.empreinteInitiale()
  );

  // Appelee par la liste en mode global. Publique a dessein : c'est la carte
  // qui detient son formulaire, elle seule peut le valider et le lire.
  collecter(): ResultatCollecte<FormationRequest> {
    if (!this.estNouvelle() && !this.estModifiee()) {
      return { statut: 'inchangee' };
    }
    const donnees = this.extraire();
    return donnees === null
      ? { statut: 'invalide' }
      : {
          statut: 'valide',
          demande: { id: this.formation()?.id ?? null, cle: this.cle(), donnees }
        };
  }

  protected majLien(lien: LienOrganisme): void {
    this.lien.set(lien);
    if (lien.organismeId || lien.nomNouvelOrganisme) {
      this.organismeManquant.set(false);
    }
  }

  protected valider(): void {
    const donnees = this.extraire();
    if (donnees !== null) {
      this.enregistrer.emit(donnees);
    }
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

  // Valide la saisie et renvoie la requete, ou null en affichant les erreurs.
  private extraire(): FormationRequest | null {
    this.soumis.set(true);

    const lien = this.lien();
    const organismeRenseigne = Boolean(lien.organismeId ?? lien.nomNouvelOrganisme);
    this.organismeManquant.set(!organismeRenseigne);

    const m = this.modele();
    const datesInvalides = Boolean(!m.enCours && m.dateFin && m.dateFin < m.dateDebut);
    this.datesInvalides.set(datesInvalides);

    if (this.formulaire().invalid() || !organismeRenseigne || datesInvalides) {
      return null;
    }

    return {
      libelle: m.libelle.trim(),
      description: m.description.trim() || null,
      typeFormation: m.typeFormation as TypeFormation,
      dateDebut: m.dateDebut,
      // Une formation en cours n'a pas de date de fin
      dateFin: m.enCours ? null : m.dateFin || null,
      estStage: m.estStage,
      ...lien
    };
  }

  private empreinte(modele: ModeleFormation, lien: LienOrganisme): string {
    return JSON.stringify([
      modele.libelle,
      modele.description,
      modele.typeFormation,
      modele.dateDebut,
      modele.dateFin,
      modele.enCours,
      modele.estStage,
      lien.organismeId ?? null,
      lien.nomNouvelOrganisme ?? null
    ]);
  }
}
