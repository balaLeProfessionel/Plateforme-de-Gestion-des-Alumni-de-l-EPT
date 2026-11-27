import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MaCandidatureEmploi, StatutCandidatureEmploi } from '../../../core/services/models/offre-emploi.model';

type Ton = 'attente' | 'avance' | 'succes' | 'neutre';

/** Ce que le candidat voit de sa candidature envoyée : où elle en est, les étapes, et ce qu’il a envoyé. */
const ETATS: Record<StatutCandidatureEmploi, { titre: string; icone: string; ton: Ton; etape: number }> = {
  RECUE: { titre: 'Candidature envoyée', icone: 'pi-send', ton: 'attente', etape: 0 },
  PRESELECTIONNEE: { titre: 'Candidature présélectionnée', icone: 'pi-star', ton: 'avance', etape: 1 },
  ENTRETIEN: { titre: 'Entretien proposé', icone: 'pi-comments', ton: 'avance', etape: 2 },
  RETENUE: { titre: 'Candidature retenue', icone: 'pi-check-circle', ton: 'succes', etape: 3 },
  NON_RETENUE: { titre: 'Candidature non retenue', icone: 'pi-info-circle', ton: 'neutre', etape: 3 },
  RETIREE: { titre: 'Candidature retirée', icone: 'pi-undo', ton: 'neutre', etape: -1 },
};

@Component({
  selector: 'app-suivi-candidature-emploi',
  imports: [DatePipe],
  templateUrl: './suivi-candidature-emploi.html',
  styleUrl: './suivi-candidature-emploi.scss',
})
export class SuiviCandidatureEmploi {
  readonly candidature = input.required<MaCandidatureEmploi>();
  readonly telecharger = output<void>();

  protected readonly etat = computed(() => ETATS[this.candidature().statut]);
  protected readonly etapes = computed(() => {
    const { statut } = this.candidature();
    const atteinte = this.etat().etape;
    const decision = statut === 'RETENUE' ? 'Retenue' : statut === 'NON_RETENUE' ? 'Non retenue' : 'Décision';
    return ['Envoyée', 'Sélection', 'Entretien', decision].map((libelle, index) => ({
      libelle, faite: index < atteinte, courante: index === atteinte,
    }));
  });
}
