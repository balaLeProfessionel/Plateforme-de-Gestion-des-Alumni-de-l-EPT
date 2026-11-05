import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { ContenuPublicService } from '../../../core/services/vitrine/contenu-public';
import { AvatarMembre } from '../../../shared/images/avatar-membre';

/** Carrousel des témoignages : le visiteur le fait défiler lui-même, sans défilement automatique. */
@Component({
  selector: 'app-temoignages-vitrine',
  imports: [AvatarMembre],
  templateUrl: './temoignages-vitrine.html',
  styleUrl: './temoignages-vitrine.scss',
})
export class TemoignagesVitrine {
  protected readonly temoignages = toSignal(
    inject(ContenuPublicService).temoignages().pipe(catchError(() => of([]))),
    { initialValue: [] }
  );
  protected readonly indexActif = signal(0);
  protected readonly plusieurs = computed(() => this.temoignages().length > 1);

  protected precedent(): void {
    const total = this.temoignages().length;
    this.indexActif.update((index) => (index - 1 + total) % total);
  }

  protected suivant(): void {
    this.indexActif.update((index) => (index + 1) % this.temoignages().length);
  }
}
