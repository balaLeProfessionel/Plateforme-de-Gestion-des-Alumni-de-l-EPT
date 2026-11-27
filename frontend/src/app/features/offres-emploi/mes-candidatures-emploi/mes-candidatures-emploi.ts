import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_STATUT_CANDIDATURE_EMPLOI, MaCandidatureEmploi } from '../../../core/services/models/offre-emploi.model';
import { OffresEmploiService } from '../../../core/services/offres-emploi/offres-emploi';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';

/** Candidatures du membre connecté aux offres gérées, avec leur statut (#222). */
@Component({
  selector: 'app-mes-candidatures-emploi',
  imports: [DatePipe, RouterLink, BoutonRetour],
  template: `
    <div class="page-emploi">
      <app-bouton-retour secours="/offres-emploi" />
      <header class="entete"><h1>Mes candidatures</h1></header>

      @if (erreur()) {
        <div class="etat" role="alert">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          <h2>Vos candidatures n’ont pas pu être chargées</h2>
          <button type="button" class="bouton" (click)="charger()">Réessayer</button>
        </div>
      } @else if (candidatures(); as liste) {
        @if (liste.length === 0) {
          <div class="etat">
            <i class="pi pi-send" aria-hidden="true"></i>
            <h2>Aucune candidature pour l’instant</h2>
            <p>Les offres marquées « Candidature sur la plateforme » se postulent ici, avec votre CV.</p>
            <a class="bouton principal" routerLink="/offres-emploi">Voir les offres</a>
          </div>
        } @else {
          <ul class="liste">
            @for (c of liste; track c.id) {
              <li class="ligne">
                <div class="principal">
                  <h2><a [routerLink]="['/offres-emploi', c.offreId]">{{ c.titreOffre }}</a></h2>
                  <p class="details">{{ c.entreprise }} · envoyée le {{ c.envoyeeLe | date: 'd MMMM y' }}
                    · {{ c.offreExpiree ? 'offre expirée' : 'offre ouverte jusqu’au ' + (c.dateExpiration | date: 'd MMMM y') }}</p>
                </div>
                <span class="statut" [attr.data-statut]="c.statut">{{ statuts[c.statut] }}</span>
              </li>
            }
          </ul>
        }
      } @else {
        <div class="squelette" aria-busy="true" aria-label="Chargement de vos candidatures"></div>
      }
    </div>
  `,
  styleUrl: './mes-candidatures-emploi.scss',
})
export class MesCandidaturesEmploi implements OnInit {
  private readonly service = inject(OffresEmploiService);

  protected readonly statuts = LIBELLES_STATUT_CANDIDATURE_EMPLOI;
  protected readonly candidatures = signal<readonly MaCandidatureEmploi[] | null>(null);
  protected readonly erreur = signal(false);

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.erreur.set(false);
    this.service.mesCandidatures().subscribe({
      next: (liste) => this.candidatures.set(liste),
      error: () => this.erreur.set(true),
    });
  }
}
