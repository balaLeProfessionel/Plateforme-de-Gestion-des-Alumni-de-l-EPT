import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_TYPE_ORGANISME, Partenaire } from '../../../core/services/models/partenariat.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';

/** Carte d’un organisme partenaire, cliquable vers sa fiche. */
@Component({
  selector: 'app-carte-partenaire',
  imports: [DatePipe, RouterLink, AvatarMembre],
  template: `
    @let p = partenaire();
    <article class="carte carte-cliquable">
      <div class="entete">
        <app-avatar-membre [urlPhoto]="p.logoUrl" [nom]="p.nom" roleMembre="ORGANISME" [taille]="3" />
        <div class="identite">
          <h2><a class="lien-etire" [routerLink]="['/organismes', p.id]">{{ p.nom }}</a></h2>
          <p>{{ p.typeOrganisme ? types[p.typeOrganisme] : 'Organisme' }}@if (p.pays) { · {{ p.pays }} }</p>
        </div>
      </div>
      @if (p.secteurActivite) { <p class="secteur">{{ p.secteurActivite }}</p> }
      @if (p.accordsStage || p.accordsMobilite) {
        <ul class="accords" aria-label="Accords en vigueur">
          @if (p.accordsStage) { <li>Accords de stage</li> }
          @if (p.accordsMobilite) { <li>Accords de mobilité</li> }
        </ul>
      }
      @if (p.partenaireDepuis) { <p class="depuis">Partenaire depuis {{ p.partenaireDepuis | date: 'MMMM y' }}</p> }
    </article>
  `,
  styleUrl: './carte-partenaire.scss',
})
export class CartePartenaire {
  readonly partenaire = input.required<Partenaire>();
  protected readonly types = LIBELLES_TYPE_ORGANISME;
}
