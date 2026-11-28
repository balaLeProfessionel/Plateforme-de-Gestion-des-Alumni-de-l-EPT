import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CandidatureRecueEmploi, LIBELLES_STATUT_CANDIDATURE_EMPLOI, OffreEmploi, StatutCandidatureEmploi,
} from '../../../core/services/models/offre-emploi.model';
import { OffresEmploiService } from '../../../core/services/offres-emploi/offres-emploi';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { CarteCandidatureRecue } from '../candidature-recue-emploi/candidature-recue-emploi';

type Tri = 'recentes' | 'anciennes' | 'nom';
const STATUTS_TRAITES: readonly StatutCandidatureEmploi[] = ['RECUE', 'PRESELECTIONNEE', 'ENTRETIEN', 'RETENUE', 'NON_RETENUE'];

/**
 * Candidatures d’une offre gérée, pour son organisme ou l’administration (#223) : filtre par statut, tri, décisions,
 * et clôture du recrutement (les candidatures sans décision deviennent non retenues).
 */
@Component({
  selector: 'app-candidatures-offre-emploi',
  imports: [RouterLink, BoutonRetour, CarteCandidatureRecue],
  templateUrl: './candidatures-offre-emploi.html',
  styleUrl: './candidatures-offre-emploi.scss',
})
export class CandidaturesOffreEmploi implements OnInit {
  private readonly service = inject(OffresEmploiService);
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly libelles = LIBELLES_STATUT_CANDIDATURE_EMPLOI;
  protected readonly offre = signal<OffreEmploi | null>(null);
  protected readonly candidatures = signal<readonly CandidatureRecueEmploi[]>([]);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly filtre = signal<StatutCandidatureEmploi | ''>('');
  protected readonly tri = signal<Tri>('recentes');
  protected readonly confirmerCloture = signal(false);
  protected readonly clotureEnCours = signal(false);
  protected readonly erreurCloture = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  protected readonly compteurs = computed(() => STATUTS_TRAITES
    .map((statut) => ({ statut, nombre: this.candidatures().filter((c) => c.statut === statut).length }))
    .filter(({ nombre }) => nombre > 0));
  protected readonly ouvertes = computed(() =>
    this.candidatures().filter((c) => ['RECUE', 'PRESELECTIONNEE', 'ENTRETIEN'].includes(c.statut)).length);
  protected readonly affichees = computed(() => {
    const filtre = this.filtre();
    const liste = this.candidatures().filter((c) => !filtre || c.statut === filtre);
    switch (this.tri()) {
      case 'anciennes': return [...liste].sort((a, b) => a.envoyeeLe.localeCompare(b.envoyeeLe));
      case 'nom': return [...liste].sort((a, b) =>
        `${a.candidat.nom} ${a.candidat.prenom}`.localeCompare(`${b.candidat.nom} ${b.candidat.prenom}`, 'fr'));
      default: return [...liste].sort((a, b) => b.envoyeeLe.localeCompare(a.envoyeeLe));
    }
  });
  protected readonly clotureable = computed(() => {
    const offre = this.offre();
    return !!offre && offre.statut === 'PUBLIEE' && !offre.cloturee;
  });

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.erreurChargement.set(null);
    forkJoin([this.service.detail(this.id), this.service.candidaturesRecues(this.id)]).subscribe({
      next: ([offre, candidatures]) => {
        this.offre.set(offre);
        this.candidatures.set(candidatures);
      },
      error: (erreur: HttpErrorResponse) => this.erreurChargement.set(erreur.status === 404
        ? 'Cette offre n’existe pas, ou vous n’en traitez pas les candidatures.'
        : erreur.error?.message ?? 'Les candidatures n’ont pas pu être chargées.'),
    });
  }

  protected choisirTri(evenement: Event): void {
    this.tri.set((evenement.target as HTMLSelectElement).value as Tri);
  }

  protected remplacer(maj: CandidatureRecueEmploi): void {
    this.candidatures.update((liste) => liste.map((c) => (c.id === maj.id ? maj : c)));
  }

  protected cloturer(): void {
    this.clotureEnCours.set(true);
    this.erreurCloture.set(null);
    this.service.cloturer(this.id).subscribe({
      next: ({ nonRetenues }) => {
        this.clotureEnCours.set(false);
        this.confirmerCloture.set(false);
        this.message.set(nonRetenues
          ? `Recrutement clôturé : ${nonRetenues} candidature${nonRetenues > 1 ? 's' : ''} sans décision ${nonRetenues > 1 ? 'sont passées' : 'est passée'} en non retenue, et les candidats sont prévenus.`
          : 'Recrutement clôturé.');
        this.charger();
      },
      error: (erreur: HttpErrorResponse) => {
        this.clotureEnCours.set(false);
        this.erreurCloture.set(erreur.error?.message ?? 'La clôture a échoué. Réessayez.');
      },
    });
  }
}
