import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CandidatureRecue, LIBELLES_AVIS_ORGANISME, LIBELLES_STATUT_OFFRE, ListeDefinitive,
} from '../../../core/services/models/stage.model';
import { libelleClasse } from '../../../core/services/models/classe.model';
import { CandidaturesService } from '../../../core/services/stages/candidatures';
import { ListeDefinitiveService } from '../../../core/services/stages/liste-definitive';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { PageAdmin } from '../page-admin/page-admin';
import { AjoutEtudiant } from './ajout-etudiant/ajout-etudiant';
import { LigneListeDefinitive } from './ligne-liste/ligne-liste';

/** Ordre de présentation des candidats : ceux que l’organisme retient d’abord. */
const ORDRE_AVIS = { RETENUE: 0, EN_ATTENTE: 1, NON_RETENUE: 2 } as const;

/**
 * Liste définitive d’une offre (STA-04), arrêtée par l’administrateur Stages. Il y place les candidats, quel que
 * soit l’avis de l’organisme, ou tout autre étudiant actif ; la liste reste un brouillon invisible jusqu’à sa
 * publication, qui confirme les stages et prévient chacun par e-mail.
 */
@Component({
  selector: 'app-liste-definitive',
  imports: [DatePipe, RouterLink, AvatarMembre, PageAdmin, LigneListeDefinitive, AjoutEtudiant],
  templateUrl: './liste-definitive.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', './liste-definitive.scss'],
})
export class ListeDefinitivePage implements OnInit {
  private readonly service = inject(ListeDefinitiveService);
  private readonly candidaturesService = inject(CandidaturesService);
  private readonly offreId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly parents = [{ libelle: 'Stages', lien: '/stages' }, { libelle: 'Offres de stage', lien: '/admin/stages/offres' }];
  protected readonly statutsOffre = LIBELLES_STATUT_OFFRE;
  protected readonly avis = LIBELLES_AVIS_ORGANISME;
  protected readonly libelleClasse = libelleClasse;
  protected readonly liste = signal<ListeDefinitive | null>(null);
  protected readonly candidatures = signal<readonly CandidatureRecue[]>([]);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly erreurAction = signal<string | null>(null);
  protected readonly enCours = signal<string | null>(null);
  protected readonly confirmationPublication = signal(false);

  protected readonly publiee = computed(() => this.liste()?.statutOffre === 'LISTE_PUBLIEE');
  protected readonly modifiable = computed(() => this.liste()?.statutOffre === 'PUBLIEE' || this.publiee());
  /** Étudiants sur la liste, hors stages annulés (qu’on peut rajouter). */
  protected readonly surLaListe = computed(() => new Set((this.liste()?.lignes ?? [])
    .filter((l) => l.statut !== 'ANNULE').map((l) => l.etudiant.id)));
  protected readonly retenus = computed(() => (this.liste()?.lignes ?? []).filter((l) => l.statut !== 'ANNULE').length);
  protected readonly sansDates = computed(() => (this.liste()?.lignes ?? []).filter((l) => l.statut === 'EN_PREPARATION' && (!l.dateDebut || !l.dateFin)).length);
  protected readonly candidatsHorsListe = computed(() => this.candidatures()
    .filter((c) => c.statut === 'ENVOYEE' && !this.surLaListe().has(c.etudiant.id))
    .sort((a, b) => ORDRE_AVIS[a.avisOrganisme] - ORDRE_AVIS[b.avisOrganisme]));
  protected readonly candidaturesOuvertes = computed(() => {
    const liste = this.liste();
    return liste !== null && liste.statutOffre === 'PUBLIEE' && liste.dateLimiteCandidature >= new Date().toLocaleDateString('sv-SE');
  });

  ngOnInit(): void {
    forkJoin({ liste: this.service.liste(this.offreId), candidatures: this.candidaturesService.recues(this.offreId) }).subscribe({
      next: ({ liste, candidatures }) => {
        this.liste.set(liste);
        this.candidatures.set(candidatures);
      },
      error: (erreur: HttpErrorResponse) => this.erreurChargement.set(erreur.status === 404
        ? 'Cette offre n’existe pas.' : erreur.error?.message ?? 'Impossible de charger la liste.'),
    });
  }

  protected miseAJour(liste: ListeDefinitive, message: string | null = null): void {
    this.liste.set(liste);
    this.message.set(message);
  }

  protected ajouterCandidat(candidature: CandidatureRecue): void {
    this.enCours.set(candidature.id);
    this.erreurAction.set(null);
    this.service.ajouter(this.offreId, candidature.etudiant.id).subscribe({
      next: (liste) => {
        this.enCours.set(null);
        this.miseAJour(liste, `${candidature.etudiant.prenom} ${candidature.etudiant.nom} est ajouté à la liste.`);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(null);
        this.erreurAction.set(erreur.error?.message ?? 'L’étudiant n’a pas pu être ajouté. Réessayez.');
      },
    });
  }

  protected publier(): void {
    this.enCours.set('publication');
    this.erreurAction.set(null);
    this.service.publier(this.offreId).subscribe({
      next: (liste) => {
        this.enCours.set(null);
        this.confirmationPublication.set(false);
        this.miseAJour(liste, 'La liste est publiée : les stages sont confirmés et chacun est prévenu par e-mail.');
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(null);
        this.erreurAction.set(erreur.error?.message ?? 'La liste n’a pas pu être publiée. Réessayez.');
      },
    });
  }
}
