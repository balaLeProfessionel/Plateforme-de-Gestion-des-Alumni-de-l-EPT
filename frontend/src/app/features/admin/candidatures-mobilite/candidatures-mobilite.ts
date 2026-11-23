import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import {
  CandidaturesOffre, DecisionMobilite, DossierMobilite, LIBELLES_STATUT_CANDIDATURE_MOBILITE, periodeLisible,
} from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { PiecesDossier } from '../../mobilites/dossiers-mobilite/pieces-dossier';
import { PageAdmin } from '../page-admin/page-admin';

const DECISIONS: readonly { valeur: DecisionMobilite; libelle: string }[] = [
  { valeur: 'RETENUE', libelle: 'Retenue' }, { valeur: 'LISTE_ATTENTE', libelle: 'Liste d’attente' }, { valeur: 'NON_RETENUE', libelle: 'Non retenue' },
];

/**
 * Dossiers d’une offre de mobilité pour le chef du service : décision par candidat après la date limite, publication
 * de la liste quand chaque dossier a la sienne, puis montée d’un candidat en attente quand une place se libère.
 */
@Component({
  selector: 'app-candidatures-mobilite',
  imports: [DatePipe, PageAdmin, PiecesDossier],
  templateUrl: './candidatures-mobilite.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', './candidatures-mobilite.scss'],
})
export class CandidaturesMobilite implements OnInit {
  private readonly service = inject(OffresMobiliteService);
  private readonly offreId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly parents = [{ libelle: 'Offres de mobilité', lien: '/admin/mobilites/offres' }];
  protected readonly decisions = DECISIONS;
  protected readonly statuts = LIBELLES_STATUT_CANDIDATURE_MOBILITE;
  protected readonly periode = periodeLisible;
  protected readonly donnees = signal<CandidaturesOffre | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly erreurAction = signal<{ id: string; message: string } | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly confirmerPublication = signal(false);
  protected readonly publiee = computed(() => this.donnees()?.offre.statut === 'LISTE_PUBLIEE');
  protected readonly placesLibres = computed(() => {
    const d = this.donnees();
    return d ? d.offre.nombrePlaces - d.retenues : 0;
  });
  protected readonly titre = computed(() => this.donnees()?.offre.titre ?? 'Candidatures');

  ngOnInit(): void {
    this.service.dossiers(this.offreId).subscribe({
      next: (donnees) => this.donnees.set(donnees),
      error: (erreur: HttpErrorResponse) => this.erreurChargement.set(erreur.status === 404
        ? 'Cette offre n’existe pas.' : erreur.error?.message ?? 'Impossible de charger les candidatures.'),
    });
  }

  protected decider(dossier: DossierMobilite, evenement: Event): void {
    const valeur = (evenement.target as HTMLSelectElement).value as DecisionMobilite | '';
    if (!valeur) return;
    this.executer(dossier.id, this.service.decider(dossier.id, valeur), null);
  }

  protected changerRang(dossier: DossierMobilite, champ: HTMLInputElement): void {
    const rang = Number(champ.value);
    if (!Number.isInteger(rang) || rang < 1) {
      this.erreurAction.set({ id: dossier.id, message: 'Le rang est un nombre entier à partir de 1.' });
      return;
    }
    this.executer(dossier.id, this.service.decider(dossier.id, 'LISTE_ATTENTE', rang), null);
  }

  protected promouvoir(dossier: DossierMobilite): void {
    this.executer(dossier.id, this.service.promouvoir(dossier.id),
      `${dossier.candidat.prenom} ${dossier.candidat.nom} prend la place libre et en est prévenu.`);
  }

  protected publier(): void {
    this.executer('liste', this.service.publierListe(this.offreId),
      'La liste est publiée : chaque candidat est prévenu de la décision, et l’établissement voit les candidats retenus.');
  }

  private executer(id: string, requete: Observable<CandidaturesOffre>, message: string | null): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreurAction.set(null);
    this.message.set(null);
    requete.subscribe({
      next: (donnees) => {
        this.enCours.set(false);
        this.confirmerPublication.set(false);
        this.donnees.set(donnees);
        this.message.set(message);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreurAction.set({ id, message: erreur.error?.message ?? 'L’action a échoué. Réessayez.' });
      },
    });
  }
}
