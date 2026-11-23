import { Component, computed, input } from '@angular/core';
import { EtatConvention, EtatEvaluation } from '../../../core/services/models/stage.model';
import { EtapeFrise, Frise } from '../../../shared/frise/frise';

/**
 * Avancement d'un stage confirmé, de la convention à la décision de l'école. L'évaluation est omise pour l'étudiant,
 * qui ne la voit pas : il suffit de ne pas passer `evaluation`. L'étape en cours porte aria-current="step".
 */
@Component({
  selector: 'app-etapes-stage',
  imports: [Frise],
  template: `<app-frise [etapes]="etapes()" libelle="Avancement du stage" />`,
})
export class EtapesStage {
  readonly convention = input.required<EtatConvention | null>();
  readonly evaluation = input<EtatEvaluation | null>(null);
  readonly stageValide = input.required<boolean | null>();

  protected readonly etapes = computed<EtapeFrise[]>(() => {
    const convention = this.convention() ?? 'AUCUNE';
    const signee = convention === 'COMPLETE';
    const etapes: EtapeFrise[] = [{
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
