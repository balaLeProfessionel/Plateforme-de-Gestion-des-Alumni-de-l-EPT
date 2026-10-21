import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Mentor } from '../../../core/services/models/mentorat.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { EtiquetteRole } from '../../../shared/roles/etiquette-role';

const DOMAINES_VISIBLES = 3;

@Component({
  selector: 'app-carte-mentor',
  imports: [RouterLink, AvatarMembre, EtiquetteRole],
  templateUrl: './carte-mentor.html',
  styleUrl: './carte-mentor.scss',
})
export class CarteMentor {
  readonly mentor = input.required<Mentor>();
  /** Mes demandes sans réponse ont atteint la limite : je ne peux plus en envoyer. */
  readonly limiteAtteinte = input(false);
  readonly demander = output<Mentor>();

  protected readonly nomAffiche = computed(() => `${this.mentor().prenom} ${this.mentor().nom}`.trim());
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
    if (this.limiteAtteinte()) return 'Limite de demandes atteinte';
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
