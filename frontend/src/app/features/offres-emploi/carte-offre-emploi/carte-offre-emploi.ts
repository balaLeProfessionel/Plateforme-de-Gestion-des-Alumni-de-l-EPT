import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_TYPE_CONTRAT, OffreEmploi } from '../../../core/services/models/offre-emploi.model';
import { presenterAuteur } from '../auteur-offre';

/** Une offre dans la liste : toute la carte mène au détail (un seul lien étiré). */
@Component({
  selector: 'app-carte-offre-emploi',
  imports: [DatePipe, RouterLink],
  template: `
    @let o = offre();
    <article class="carte carte-cliquable" [class.expiree]="o.expiree">
      <div class="haut">
        <span class="pastille type">{{ types[o.typeContrat] }}</span>
        @if (o.mode === 'RELAYEE') { <span class="pastille">Offre relayée</span> }
        @else { <span class="pastille plateforme">Candidature sur la plateforme</span> }
        @if (o.expiree) { <span class="pastille expiree">Expirée</span> }
      </div>
      <h2><a class="lien-etire" [routerLink]="['/offres-emploi', o.id]">{{ o.titre }}</a></h2>
      <p class="entreprise">{{ o.entreprise }}</p>
      <ul class="infos">
        <li><i class="pi pi-map-marker" aria-hidden="true"></i>{{ o.lieu }}</li>
        <li><i class="pi pi-calendar" aria-hidden="true"></i>
          {{ o.expiree ? 'Expirée le' : 'Jusqu’au' }} {{ o.dateExpiration | date: 'd MMMM y' }}</li>
        @if (o.mode === 'RELAYEE') { <li><i class="pi pi-share-alt" aria-hidden="true"></i>Relayée par {{ auteur() }}</li> }
        @else { <li><i class="pi pi-building" aria-hidden="true"></i>Publiée par l’organisme recruteur</li> }
      </ul>
    </article>
  `,
  styleUrl: './carte-offre-emploi.scss',
})
export class CarteOffreEmploi {
  readonly offre = input.required<OffreEmploi>();
  protected readonly types = LIBELLES_TYPE_CONTRAT;
  protected readonly auteur = computed(() => presenterAuteur(this.offre().auteur));
}
