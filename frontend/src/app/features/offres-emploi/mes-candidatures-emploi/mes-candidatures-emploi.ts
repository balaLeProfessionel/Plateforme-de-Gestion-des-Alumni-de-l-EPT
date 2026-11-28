import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LIBELLES_STATUT_CANDIDATURE_EMPLOI, MaCandidatureEmploi, StatutCandidatureEmploi,
} from '../../../core/services/models/offre-emploi.model';
import { OffresEmploiService } from '../../../core/services/offres-emploi/offres-emploi';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';

type Segment = 'faite' | 'retenue' | 'refusee' | 'vide';

/** Une carte : la candidature et ses quatre segments d'avancement (envoi, sélection, entretien, décision). */
interface CarteCandidature {
  candidature: MaCandidatureEmploi;
  segments: Segment[];
}

const ICONES_STATUT: Record<StatutCandidatureEmploi, string> = {
  RECUE: 'pi-send', PRESELECTIONNEE: 'pi-star', ENTRETIEN: 'pi-comments',
  RETENUE: 'pi-check-circle', NON_RETENUE: 'pi-times-circle', RETIREE: 'pi-undo',
};
const ETAPES: readonly StatutCandidatureEmploi[] = ['RECUE', 'PRESELECTIONNEE', 'ENTRETIEN'];

/**
 * Segments franchis, sans cocher une étape que le recruteur a sautée (même règle que le suivi). L'envoi compte toujours :
 * une candidature antérieure à l'historique n'a pas d'entrée « reçue ». Une candidature retirée reste grise.
 */
function segments(c: MaCandidatureEmploi): Segment[] {
  const etapes: Segment[] = ETAPES.map((s, index) =>
    (c.statut !== 'RETIREE' && (index === 0 || c.statutsAtteints.includes(s)) ? 'faite' : 'vide'));
  const decision: Segment = c.statut === 'RETENUE' ? 'retenue' : c.statut === 'NON_RETENUE' ? 'refusee' : 'vide';
  return [...etapes, decision];
}

/** Candidatures du membre connecté aux offres gérées, en cours puis terminées (#222). */
@Component({
  selector: 'app-mes-candidatures-emploi',
  imports: [DatePipe, RouterLink, BoutonRetour],
  templateUrl: './mes-candidatures-emploi.html',
  styleUrl: './mes-candidatures-emploi.scss',
})
export class MesCandidaturesEmploi implements OnInit {
  private readonly service = inject(OffresEmploiService);

  protected readonly statuts = LIBELLES_STATUT_CANDIDATURE_EMPLOI;
  protected readonly icones = ICONES_STATUT;
  protected readonly candidatures = signal<readonly MaCandidatureEmploi[] | null>(null);
  protected readonly erreur = signal(false);
  /** En cours (en attente d'une décision) puis terminées ; une section vide n'est pas affichée. */
  protected readonly sections = computed(() => {
    const cartes = (this.candidatures() ?? []).map((candidature) => ({ candidature, segments: segments(candidature) }));
    const enCours = (c: CarteCandidature) => c.candidature.statut === 'RECUE' || c.candidature.statut === 'PRESELECTIONNEE'
      || c.candidature.statut === 'ENTRETIEN';
    return [
      { id: 'en-cours', titre: 'En cours', cartes: cartes.filter(enCours) },
      { id: 'terminees', titre: 'Terminées', cartes: cartes.filter((c) => !enCours(c)) },
    ].filter((s) => s.cartes.length > 0);
  });

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
