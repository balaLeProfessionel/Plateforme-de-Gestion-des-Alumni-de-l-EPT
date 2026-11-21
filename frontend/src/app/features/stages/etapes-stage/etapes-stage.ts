import { Component, computed, input } from '@angular/core';
import { EtatConvention, EtatEvaluation } from '../../../core/services/models/stage.model';

type Avancement = 'fait' | 'en-cours' | 'a-venir' | 'refuse';

interface Etape {
  titre: string;
  etat: string;
  avancement: Avancement;
}

/**
 * Avancement d'un stage confirmé, de la convention à la décision de l'école. L'évaluation est omise pour l'étudiant,
 * qui ne la voit pas : il suffit de ne pas passer `evaluation`. L'étape en cours porte aria-current="step".
 */
@Component({
  selector: 'app-etapes-stage',
  template: `
    <ol aria-label="Avancement du stage">
      @for (e of etapes(); track e.titre) {
        <li [attr.data-avancement]="e.avancement" [attr.aria-current]="e.avancement === 'en-cours' ? 'step' : null">
          <span class="repere" aria-hidden="true">
            @switch (e.avancement) {
              @case ('fait') { <i class="pi pi-check"></i> }
              @case ('refuse') { <i class="pi pi-times"></i> }
            }
          </span>
          <span class="texte"><strong>{{ e.titre }}</strong><span class="etat">{{ ' ' + e.etat }}</span></span>
        </li>
      }
    </ol>
  `,
  styleUrl: './etapes-stage.scss',
})
export class EtapesStage {
  readonly convention = input.required<EtatConvention | null>();
  readonly evaluation = input<EtatEvaluation | null>(null);
  readonly stageValide = input.required<boolean | null>();

  protected readonly etapes = computed<Etape[]>(() => {
    const convention = this.convention() ?? 'AUCUNE';
    const signee = convention === 'COMPLETE';
    const etapes: Etape[] = [{
      titre: 'Convention',
      etat: signee ? 'signée et déposée' : convention === 'EN_COURS' ? 'signatures en cours' : 'à préparer',
      avancement: signee ? 'fait' : 'en-cours',
    }];
    const evaluation = this.evaluation();
    if (evaluation !== null) {
      etapes.push({
        titre: 'Évaluation',
        etat: evaluation === 'SOUMISE' ? 'remise par l’organisme' : !signee ? 'après la convention'
          : evaluation === 'BROUILLON' ? 'en cours de saisie' : 'attendue de l’organisme',
        avancement: evaluation === 'SOUMISE' ? 'fait' : signee ? 'en-cours' : 'a-venir',
      });
    }
    const pret = signee && (evaluation === null || evaluation === 'SOUMISE');
    const valide = this.stageValide();
    etapes.push({
      titre: 'Décision de l’école',
      etat: valide === true ? 'stage validé' : valide === false ? 'stage non validé' : pret ? 'en attente' : 'à venir',
      avancement: valide === true ? 'fait' : valide === false ? 'refuse' : pret ? 'en-cours' : 'a-venir',
    });
    return etapes;
  });
}
