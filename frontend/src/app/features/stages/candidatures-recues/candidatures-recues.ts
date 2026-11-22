import { DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AvisOrganisme, CandidatureRecue, LIBELLES_AVIS_ORGANISME, LIBELLES_STATUT_CANDIDATURE, OffreStage, Stagiaire,
} from '../../../core/services/models/stage.model';
import { libelleClasse } from '../../../core/services/models/classe.model';
import { CandidaturesService } from '../../../core/services/stages/candidatures';
import { ListeDefinitiveService } from '../../../core/services/stages/liste-definitive';
import { OffresStageService } from '../../../core/services/stages/offres-stage';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { enregistrerFichier } from '../../../shared/telecharger';

/**
 * Candidatures reçues par une offre. L’organisme (route data `administration` absente) voit les candidatures
 * envoyées et donne son avis (STA-09) ; l’administrateur Stages voit aussi les retirées, l’e-mail et l’avis donné.
 * Une fois la liste définitive publiée, la page montre en tête les stagiaires confirmés par l’école et fige les avis.
 */
@Component({
  selector: 'app-candidatures-recues',
  imports: [DatePipe, RouterLink, AvatarMembre, FilAriane],
  templateUrl: './candidatures-recues.html',
  styleUrl: './candidatures-recues.scss',
})
export class CandidaturesRecues implements OnInit {
  private readonly service = inject(CandidaturesService);
  private readonly offresService = inject(OffresStageService);
  private readonly listeService = inject(ListeDefinitiveService);
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);

  private readonly offreId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly administration = this.route.snapshot.data['administration'] === true;
  protected readonly etapes = computed(() => this.administration
    ? [{ libelle: 'Administration', lien: '/admin' }, { libelle: 'Offres de stage', lien: '/admin/stages/offres' },
      { libelle: this.offre()?.titre ?? 'Offre', lien: `/stages/offres/${this.offreId}` }, { libelle: 'Candidatures' }]
    : [{ libelle: 'Mes offres', lien: '/stages/mes-offres' },
      { libelle: this.offre()?.titre ?? 'Offre', lien: `/stages/offres/${this.offreId}` }, { libelle: 'Candidatures' }]);
  protected readonly statuts = LIBELLES_STATUT_CANDIDATURE;
  protected readonly libelleClasse = libelleClasse;
  protected readonly libellesAvis = LIBELLES_AVIS_ORGANISME;
  protected readonly avisPossibles: readonly AvisOrganisme[] = ['RETENUE', 'NON_RETENUE', 'EN_ATTENTE'];
  protected readonly offre = signal<OffreStage | null>(null);
  /** Stagiaires confirmés par l’école, une fois la liste définitive publiée (STA-04). */
  protected readonly stagiaires = signal<readonly Stagiaire[] | null>(null);
  /** L’avis de l’organisme ne change plus quand l’offre n’est plus ouverte aux candidatures (liste publiée). */
  protected readonly avisFiges = computed(() => this.offre()?.statut === 'LISTE_PUBLIEE');
  protected readonly candidatures = signal<readonly CandidatureRecue[] | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly erreurAction = signal<{ id: string; message: string } | null>(null);
  protected readonly envoyees = computed(() => (this.candidatures() ?? []).filter((c) => c.statut === 'ENVOYEE').length);
  protected readonly retenues = computed(() => (this.candidatures() ?? []).filter((c) => c.statut === 'ENVOYEE' && c.avisOrganisme === 'RETENUE').length);

  ngOnInit(): void {
    this.offresService.detail(this.offreId).subscribe({
      next: (offre) => {
        this.offre.set(offre);
        if (offre.statut === 'LISTE_PUBLIEE') {
          this.listeService.stagiaires(this.offreId).subscribe({ next: (liste) => this.stagiaires.set(liste), error: () => undefined });
        }
      },
      error: () => undefined,
    });
    this.service.recues(this.offreId).subscribe({
      next: (liste) => this.candidatures.set(liste),
      error: (erreur: HttpErrorResponse) => this.erreurChargement.set(erreur.status === 404
        ? 'Cette offre n’existe pas, ou ses candidatures ne vous sont pas accessibles.'
        : erreur.error?.message ?? 'Impossible de charger les candidatures.'),
    });
  }

  protected donnerAvis(candidature: CandidatureRecue, avis: AvisOrganisme): void {
    if (candidature.avisOrganisme === avis) return;
    this.erreurAction.set(null);
    this.service.donnerAvis(candidature.id, avis).subscribe({
      next: (miseAJour) => this.candidatures.update((liste) => liste?.map((c) => c.id === miseAJour.id ? miseAJour : c) ?? null),
      error: (erreur: HttpErrorResponse) => this.erreurAction.set({
        id: candidature.id, message: erreur.error?.message ?? 'L’avis n’a pas pu être enregistré. Réessayez.',
      }),
    });
  }

  protected telechargerCv(candidature: CandidatureRecue): void {
    this.erreurAction.set(null);
    this.service.telechargerCv(candidature.id).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, candidature.nomCv),
      error: () => this.erreurAction.set({ id: candidature.id, message: 'Le CV n’a pas pu être téléchargé. Réessayez.' }),
    });
  }
}
