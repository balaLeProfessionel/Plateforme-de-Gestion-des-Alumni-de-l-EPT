import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CandidatureMobilite, LIBELLES_STATUT_CANDIDATURE_MOBILITE, LIBELLES_TYPE_MOBILITE, periodeLisible,
} from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { EtapeFrise, Frise } from '../../../shared/frise/frise';

/** Étapes d’une candidature, de l’envoi à la décision de l’école. */
export function etapesCandidature(c: CandidatureMobilite): EtapeFrise[] {
  const retiree = c.statut === 'RETIREE';
  const dossier: EtapeFrise = retiree
    ? { titre: 'Dossier', etat: 'retiré', avancement: 'refuse' }
    : { titre: 'Dossier', etat: 'envoyé', avancement: 'fait' };
  const titre = 'Décision de l’école';
  const decision: EtapeFrise = c.statut === 'RETENUE' ? { titre, etat: 'retenue', avancement: 'fait' }
    : c.statut === 'LISTE_ATTENTE' ? { titre, etat: `liste d’attente, rang ${c.rangAttente ?? '–'}`, avancement: 'en-cours' }
    : c.statut === 'NON_RETENUE' ? { titre, etat: 'non retenue', avancement: 'refuse' }
    : c.statut === 'DESISTEE' ? { titre, etat: 'désistement', avancement: 'refuse' }
    : c.offre.statut === 'RETIREE' ? { titre, etat: 'offre retirée par l’école', avancement: 'refuse' }
    : retiree || c.offre.candidaturesOuvertes ? { titre, etat: 'après la date limite', avancement: 'a-venir' }
    : { titre, etat: 'dossiers en cours d’examen', avancement: 'en-cours' };
  return [dossier, decision];
}

/** Candidatures de mobilité de l’étudiant ou de l’enseignant connecté. */
@Component({
  selector: 'app-mes-candidatures-mobilite',
  imports: [DatePipe, RouterLink, FilAriane, Frise],
  templateUrl: './mes-candidatures-mobilite.html',
  styleUrl: '../mes-offres-mobilite/mes-offres-mobilite.scss',
})
export class MesCandidaturesMobilite implements OnInit {
  private readonly service = inject(OffresMobiliteService);

  protected readonly etapes = [{ libelle: 'Mobilités', lien: '/mobilites' }, { libelle: 'Mes candidatures' }];
  protected readonly types = LIBELLES_TYPE_MOBILITE;
  protected readonly statuts = LIBELLES_STATUT_CANDIDATURE_MOBILITE;
  protected readonly periode = periodeLisible;
  protected readonly frise = etapesCandidature;
  protected readonly candidatures = signal<CandidatureMobilite[] | null>(null);
  protected readonly erreurChargement = signal(false);
  protected readonly aDesister = signal<string | null>(null);
  protected readonly erreurDesistement = signal<string | null>(null);
  protected readonly message = signal('');
  protected readonly enCours = signal(false);

  ngOnInit(): void {
    this.charger();
  }

  protected desister(c: CandidatureMobilite): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.service.desister(c.id).subscribe({
      next: () => {
        this.enCours.set(false);
        this.aDesister.set(null);
        this.message.set(`Vous vous êtes désisté de « ${c.offre.titre} ». Le service mobilité en est prévenu.`);
        this.charger();
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreurDesistement.set(erreur.error?.message ?? 'Le désistement a échoué. Réessayez.');
      },
    });
  }

  protected charger(): void {
    this.erreurChargement.set(false);
    this.service.mesCandidatures().subscribe({
      next: (liste) => this.candidatures.set(liste),
      error: () => this.erreurChargement.set(true),
    });
  }
}
