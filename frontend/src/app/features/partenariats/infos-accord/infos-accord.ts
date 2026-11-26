import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Accord, LIBELLES_TYPE_ACCORD } from '../../../core/services/models/partenariat.model';
import { StatutAccordPastille } from '../statut-accord/statut-accord';

/** Informations d’un accord, communes à l’organisme et au service des Relations extérieures. */
@Component({
  selector: 'app-infos-accord',
  imports: [DatePipe, RouterLink, StatutAccordPastille],
  template: `
    @let a = accord();
    <dl class="infos">
      <div><dt>Statut</dt><dd><app-statut-accord [statut]="a.statut" /></dd></div>
      <div><dt>Type</dt><dd>Accord de {{ types[a.type].toLowerCase() }}</dd></div>
      <div><dt>Organisme</dt><dd>
        @if (lienOrganisme()) { <a [routerLink]="['/organismes', a.organismeId]">{{ a.organismeNom }}</a> } @else { {{ a.organismeNom }} }
      </dd></div>
      <div><dt>Proposé par</dt><dd>{{ a.proposePar === 'ECOLE' ? 'l’EPT' : a.organismeNom }}, le {{ a.creeLe | date: 'd MMMM y' }}</dd></div>
      <div><dt>Période</dt><dd>du {{ a.dateDebut | date: 'd MMMM y' }} au {{ a.dateFin | date: 'd MMMM y' }}</dd></div>
      @if (a.nombrePlaces) { <div><dt>Places</dt><dd>{{ a.nombrePlaces }}</dd></div> }
      <div><dt>Filières</dt><dd>{{ a.filieres.length ? filieres() : 'Toutes' }}</dd></div>
      <div><dt>Convention-cadre</dt><dd>{{ a.conventionObjet ?? 'Aucune' }}</dd></div>
      @if (a.description) { <div class="large"><dt>Description</dt><dd class="texte">{{ a.description }}</dd></div> }
      @if (a.dateEffetResiliation && (a.statut === 'ACTIF' || a.statut === 'A_VENIR')) {
        <div class="large"><dt>Résiliation en cours</dt><dd class="alerte">Signalée par {{ a.resiliationDemandeePar === 'ECOLE' ? 'l’EPT' : a.organismeNom }}
          le {{ a.resiliationDemandeeLe | date: 'd MMMM y' }}, effective le {{ a.dateEffetResiliation | date: 'd MMMM y' }}</dd></div>
      }
      @if (a.motifDecision) { <div class="large"><dt>Motif</dt><dd>{{ a.motifDecision }}</dd></div> }
    </dl>
  `,
  styleUrl: '../infos-convention/infos-convention.scss',
})
export class InfosAccord {
  readonly accord = input.required<Accord>();
  readonly lienOrganisme = input(false);
  protected readonly types = LIBELLES_TYPE_ACCORD;
  protected filieres(): string {
    return this.accord().filieres.map((f) => f.nom).join(', ');
  }
}
