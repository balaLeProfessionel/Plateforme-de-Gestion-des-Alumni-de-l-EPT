import { Component, DestroyRef, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { LienOrganisme } from '../../../../core/services/models/profil.model';
import { OrganismeSuggestion } from '../../../../core/services/models/organisme.model';

// Nombre de caracteres avant de solliciter le serveur
const MIN_CARACTERES = 2;
// Delai d'inactivite avant de demander une recherche au parent
const DELAI_DEBOUNCE_MS = 300;

// Champ de saisie d'un organisme, partage par les cartes formation et
// experience. Il ne fait AUCUN appel reseau : il emet (rechercher) avec le
// texte saisi et recoit les resultats par l'input suggestions. C'est ce qui
// le rend reutilisable dans n'importe quelle page.
//
// Construit sur un <input> natif : p-autocomplete de PrimeNG souffre de la
// meme incompatibilite que p-select avec les Signal Forms.
@Component({
  selector: 'app-autocomplete-organisme',
  templateUrl: './autocomplete-organisme.html',
  styleUrl: './autocomplete-organisme.scss'
})
export class AutocompleteOrganisme {
  // Identifiant unique : une page affiche plusieurs autocompletes (une par
  // carte), et chaque label doit pointer vers son propre champ.
  readonly idChamp = input.required<string>();
  readonly libelle = input('Organisme');

  // Nom deja enregistre, pour l'edition d'une formation ou d'une experience
  readonly valeurInitiale = input('');
  readonly suggestions = input<OrganismeSuggestion[]>([]);
  readonly enRecherche = input(false);

  // Texte saisi, a charge du parent d'appeler le service et de renvoyer
  // le resultat dans suggestions.
  readonly rechercher = output<string>();
  // Choix courant, dans le format attendu par les DTO du backend
  readonly choix = output<LienOrganisme>();

  private readonly destroyRef = inject(DestroyRef);

  // valeurInitiale est en lecture seule : on en derive le texte editable,
  // qui se resynchronise si le parent fournit une autre valeur.
  protected readonly texte = linkedSignal(() => this.valeurInitiale());

  protected readonly ouvert = signal(false);
  // Index de la suggestion survolee au clavier (-1 = aucune)
  protected readonly indexActif = signal(-1);
  // Renseigne uniquement quand l'utilisateur a choisi dans la liste
  private readonly selection = signal<OrganismeSuggestion | null>(null);

  // Vrai quand le texte saisi ne correspond a aucune suggestion connue :
  // c'est le seul cas ou un nouvel organisme sera cree.
  protected readonly creeraNouvelOrganisme = computed(() => {
    const saisi = this.texte().trim();
    if (saisi.length === 0 || this.selection() !== null) {
      return false;
    }
    return !this.suggestions().some(
      (s) => s.nom.toLowerCase() === saisi.toLowerCase()
    );
  });

  protected readonly listeVisible = computed(
    () => this.ouvert() && this.suggestions().length > 0
  );

  private minuteur: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.annulerMinuteur());
  }

  protected saisir(valeur: string): void {
    this.texte.set(valeur);
    // Toute frappe invalide la selection precedente
    this.selection.set(null);
    this.indexActif.set(-1);
    this.ouvert.set(true);

    // Le choix est emis immediatement : il ne coute rien et le parent doit
    // toujours connaitre la valeur courante, meme si l'utilisateur enregistre
    // avant la fin du debounce.
    this.emettreChoix();

    // Seule la recherche est retardee, car elle declenche un appel reseau.
    this.annulerMinuteur();
    const aChercher = valeur.trim();
    if (aChercher.length < MIN_CARACTERES) {
      return;
    }
    this.minuteur = setTimeout(() => this.rechercher.emit(aChercher), DELAI_DEBOUNCE_MS);
  }

  protected selectionner(suggestion: OrganismeSuggestion): void {
    this.annulerMinuteur();
    this.selection.set(suggestion);
    this.texte.set(suggestion.nom);
    this.fermer();
    this.choix.emit({ organismeId: suggestion.id });
  }

  // Navigation clavier dans la liste (motif combobox)
  protected auClavier(evenement: KeyboardEvent): void {
    const liste = this.suggestions();

    switch (evenement.key) {
      case 'ArrowDown':
        evenement.preventDefault();
        if (liste.length > 0) {
          this.ouvert.set(true);
          this.indexActif.update((i) => (i + 1) % liste.length);
        }
        break;
      case 'ArrowUp':
        evenement.preventDefault();
        if (liste.length > 0) {
          this.ouvert.set(true);
          this.indexActif.update((i) => (i <= 0 ? liste.length - 1 : i - 1));
        }
        break;
      case 'Enter': {
        const actif = liste[this.indexActif()];
        if (this.ouvert() && actif) {
          // On empeche la soumission du formulaire parent : ici Entree
          // sert a valider la suggestion survolee.
          evenement.preventDefault();
          this.selectionner(actif);
        }
        break;
      }
      case 'Escape':
        this.fermer();
        break;
    }
  }

  protected ouvrir(): void {
    if (this.suggestions().length > 0) {
      this.ouvert.set(true);
    }
  }

  protected fermer(): void {
    this.ouvert.set(false);
    this.indexActif.set(-1);
  }

  // Identifiants ARIA : uniques par instance grace a idChamp
  protected idListe(): string {
    return `${this.idChamp()}-liste`;
  }

  protected idOption(index: number): string {
    return `${this.idChamp()}-option-${index}`;
  }

  protected idAide(): string {
    return `${this.idChamp()}-aide`;
  }

  private emettreChoix(): void {
    const saisi = this.texte().trim();
    // Champ vide : le parent doit savoir qu'aucun organisme n'est retenu
    this.choix.emit(saisi.length === 0 ? {} : { nomNouvelOrganisme: saisi });
  }

  private annulerMinuteur(): void {
    if (this.minuteur !== null) {
      clearTimeout(this.minuteur);
      this.minuteur = null;
    }
  }
}
