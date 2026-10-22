import { Component, DestroyRef, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { debounceTime, distinctUntilChanged, map, skip } from 'rxjs';

import { FiltresEvenements, PeriodeEvenement } from '../../../core/services/models/evenement';

const DELAI_SAISIE_MS = 300;

/**
 * Recherche toujours visible ; période, lieu et organisation repliés derrière « Filtres »,
 * dont le compteur signale les critères cachés en vigueur. Le texte s’applique après une courte
 * pause de saisie, le reste tout de suite ; pas de bouton « Rechercher ».
 */
@Component({
  selector: 'app-filtres-evenements',
  imports: [FormField],
  templateUrl: './filtres-evenements.html',
  styleUrl: './filtres-evenements.scss',
})
export class BarreFiltresEvenements {
  /** Critères en vigueur (lus dans l’URL par la page). */
  readonly filtres = input.required<FiltresEvenements>();
  readonly periode = input.required<PeriodeEvenement>();
  readonly modifies = output<FiltresEvenements>();
  readonly periodeChoisie = output<PeriodeEvenement>();
  /** Tout remettre à zéro (textes, organisation et période) : une seule navigation côté page. */
  readonly effaces = output<void>();

  protected readonly ouvert = signal(false);
  /** Saisie en cours : suit l’URL (retour arrière, lien partagé) tout en restant modifiable. */
  protected readonly saisie = linkedSignal(() => ({ recherche: this.filtres().recherche, lieu: this.filtres().lieu }));
  protected readonly formulaire = form(this.saisie);
  /** Critères repliés en vigueur : les événements passés comptent, la période par défaut non. */
  protected readonly caches = computed(() => {
    const { lieu, officiel } = this.filtres();
    return [lieu, officiel, this.periode() === 'PASSES'].filter(Boolean).length;
  });
  protected readonly effacable = computed(() => this.caches() > 0 || !!this.filtres().recherche);

  constructor() {
    toObservable(this.saisie).pipe(
      skip(1),
      debounceTime(DELAI_SAISIE_MS),
      map(({ recherche, lieu }) => ({ recherche: recherche.trim(), lieu: lieu.trim() })),
      distinctUntilChanged((a, b) => a.recherche === b.recherche && a.lieu === b.lieu),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe((textes) => {
      const { recherche, lieu } = this.filtres();
      if (textes.recherche !== recherche || textes.lieu !== lieu) this.appliquer(textes);
    });
  }

  protected appliquerTout(): void {
    this.appliquer({ recherche: this.saisie().recherche.trim(), lieu: this.saisie().lieu.trim() });
  }

  protected choisirOrganisation(officiel: FiltresEvenements['officiel']): void {
    this.appliquer({ officiel });
  }

  protected choisirPeriode(periode: PeriodeEvenement): void {
    if (periode !== this.periode()) this.periodeChoisie.emit(periode);
  }

  protected effacer(): void {
    this.saisie.set({ recherche: '', lieu: '' });
    this.effaces.emit();
  }

  private appliquer(changement: Partial<FiltresEvenements>): void {
    this.modifies.emit({ ...this.filtres(), ...changement });
  }
}
