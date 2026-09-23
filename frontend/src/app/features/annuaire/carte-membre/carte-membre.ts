import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnnuaireMembre } from '../../../core/services/models/annuaire.model';

@Component({
  selector: 'app-carte-membre',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './carte-membre.html',
  styleUrl: './carte-membre.scss',
})
export class CarteMembre {
  readonly membre = input.required<AnnuaireMembre>();
  protected readonly imageInvalide = signal(false);

  protected readonly initiales = computed(() => {
    const membre = this.membre();
    return `${membre.prenom?.charAt(0) ?? ''}${membre.nom?.charAt(0) ?? ''}`.toUpperCase();
  });

  protected readonly estOrganisme = computed(() => this.membre().role === 'ORGANISME');

  protected readonly nomAffiche = computed(() => {
    const membre = this.membre();
    return [membre.prenom, membre.nom].filter(Boolean).join(' ');
  });

  protected readonly badge = computed(() => {
    const membre = this.membre();
    if (membre.statutCompte === 'EN_ATTENTE') {
      return 'En attente';
    }
    return ({
      ETUDIANT: 'Étudiant',
      ALUMNI: 'Alumni',
      PERSONNEL: 'Personnel',
      ORGANISME: 'Organisme'
    } as const)[membre.role as 'ETUDIANT' | 'ALUMNI' | 'PERSONNEL' | 'ORGANISME'] ?? null;
  });
}
