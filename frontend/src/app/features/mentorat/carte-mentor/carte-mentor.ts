import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Mentor } from '../../../core/services/models/mentorat.model';

const DOMAINES_VISIBLES = 3;

@Component({
  selector: 'app-carte-mentor',
  imports: [RouterLink],
  templateUrl: './carte-mentor.html',
  styleUrl: './carte-mentor.scss',
})
export class CarteMentor {
  readonly mentor = input.required<Mentor>();
  readonly demander = output<Mentor>();

  protected readonly imageInvalide = linkedSignal({
    source: () => this.mentor().urlPhoto,
    computation: () => false,
  });

  protected readonly nomAffiche = computed(() => `${this.mentor().prenom} ${this.mentor().nom}`.trim());
  protected readonly initiales = computed(() =>
    [this.mentor().prenom, this.mentor().nom].map((mot) => mot.charAt(0)).join('').toUpperCase());
  protected readonly parcours = computed(() => {
    const { anneeSortie, filiere } = this.mentor();
    return [anneeSortie ? `Promo ${anneeSortie}` : null, filiere].filter(Boolean).join(' · ') || null;
  });
  protected readonly domainesVisibles = computed(() => this.mentor().domaines.slice(0, DOMAINES_VISIBLES));
  protected readonly domainesMasques = computed(() =>
    Math.max(0, this.mentor().domaines.length - DOMAINES_VISIBLES));

  /** Pourquoi la demande est impossible, ou null quand le mentor peut être sollicité. */
  protected readonly blocage = computed(() => {
    const { demandeEnCours, disponible, placesRestantes } = this.mentor();
    if (demandeEnCours) return 'Demande envoyée';
    if (!disponible) return 'Indisponible';
    if (placesRestantes <= 0) return 'Complet';
    return null;
  });

  protected readonly disponibilite = computed(() => {
    const places = this.mentor().placesRestantes;
    if (!this.mentor().disponible) return 'Indisponible pour le moment';
    if (places <= 0) return 'Complet';
    return `Disponible · ${places} place${places > 1 ? 's' : ''}`;
  });
}
