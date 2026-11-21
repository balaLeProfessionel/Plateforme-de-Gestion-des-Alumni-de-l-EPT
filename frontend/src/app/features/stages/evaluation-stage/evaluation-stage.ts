import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import {
  AppreciationGenerale, CritereGrille, Evaluation, LIBELLES_APPRECIATION, LIBELLES_EVALUATION, LIBELLES_NIVEAU,
  LONGUEUR_TEXTE_EVALUATION, NiveauCritere, SaisieEvaluation,
} from '../../../core/services/models/stage.model';
import { SuiviStagesService } from '../../../core/services/stages/suivi-stages';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { FicheSuivi } from '../fiche-suivi/fiche-suivi';

type ChampTexte = 'pointsForts' | 'axesAmelioration' | 'observations';
type Decision = 'valider' | 'invalider' | 'annuler' | 'rouvrir';

/** Ce que chaque décision change, affiché avant de la confirmer (backend : EvaluationsStageService). */
const CONFIRMATIONS: Record<Decision, { consequence: string; bouton: string }> = {
  valider: { consequence: 'Le stage sera marqué validé. L’étudiant verra la décision dans « Mes stages ».', bouton: 'Confirmer la validation' },
  invalider: { consequence: 'Le stage sera marqué non validé. L’étudiant verra la décision dans « Mes stages ».', bouton: 'Confirmer : stage non validé' },
  annuler: { consequence: 'Le stage repassera sans décision de l’école, et l’étudiant ne verra plus de décision.', bouton: 'Confirmer l’annulation' },
  rouvrir: { consequence: 'Le maître de stage pourra de nouveau modifier l’évaluation, qui devra être remise à nouveau. La décision de l’école sera effacée.', bouton: 'Confirmer la réouverture' },
};

const SAISIE_VIDE: SaisieEvaluation = {
  criteres: {}, dureeEffectiveMois: null, pointsForts: '', axesAmelioration: '', observations: '', appreciationGenerale: null, avisTuteurValide: null,
};

/**
 * Fiche d’évaluation du stagiaire (STA-06), reprise de la fiche de l’école. Saisie par l’organisme, ou par
 * l’administrateur Stages (route admin, data.ecole) pour un organisme sans compte ; lue par l’encadrant et le chef de
 * département une fois remise. L’administrateur la rouvre et décide de la validation finale du stage.
 */
@Component({
  selector: 'app-evaluation-stage',
  imports: [DatePipe, FilAriane, FicheSuivi],
  templateUrl: './evaluation-stage.html',
  styleUrl: './evaluation-stage.scss',
})
export class EvaluationStagePage {
  private readonly service = inject(SuiviStagesService);
  private readonly route = inject(ActivatedRoute);
  private readonly stageId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly ecole = this.route.snapshot.data['ecole'] === true;

  protected readonly etapes = this.ecole
    ? [{ libelle: 'Administration', lien: '/admin' }, { libelle: 'Suivi des stages', lien: '/admin/stages/suivi' }, { libelle: 'Évaluation' }]
    : [{ libelle: 'Stages', lien: '/stages' }, { libelle: 'Suivi des stages', lien: '/stages/suivi' }, { libelle: 'Évaluation' }];
  protected readonly niveaux = Object.entries(LIBELLES_NIVEAU) as [NiveauCritere, string][];
  protected readonly appreciations = Object.entries(LIBELLES_APPRECIATION) as [AppreciationGenerale, string][];
  protected readonly etats = LIBELLES_EVALUATION;
  protected readonly longueur = LONGUEUR_TEXTE_EVALUATION;

  protected readonly evaluation = signal<Evaluation | null>(null);
  protected readonly saisie = signal<SaisieEvaluation>(SAISIE_VIDE);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly confirmation = signal(false);
  protected readonly confirmations = CONFIRMATIONS;
  protected readonly decisionDemandee = signal<Decision | null>(null);
  /** Une décision prise s'affiche seule ; ses choix ne reviennent que sur « Changer la décision ». */
  protected readonly changementDecision = signal(false);
  /** Retour d'une décision, affiché dans la section de décision plutôt qu'en haut de page. */
  protected readonly messageDecision = signal<string | null>(null);

  protected readonly sections = computed(() => {
    const grille = this.evaluation()?.grille ?? [];
    return [
      { titre: 'I. Compétences techniques et professionnelles', criteres: grille.filter((c) => c.section === 'TECHNIQUE') },
      { titre: 'II. Qualités personnelles', criteres: grille.filter((c) => c.section === 'PERSONNELLE') },
    ];
  });
  protected readonly sansReponse = computed(() => {
    const grille = this.evaluation()?.grille ?? [];
    return grille.filter((c) => !this.saisie().criteres[c.code]).length;
  });

  constructor() {
    this.service.evaluation(this.stageId, this.ecole).pipe(takeUntilDestroyed()).subscribe({
      next: (evaluation) => this.afficher(evaluation),
      error: (erreur: HttpErrorResponse) => this.erreurChargement.set(erreur.status === 404
        ? 'Cette évaluation n’existe pas ou ne vous est pas accessible.' : erreur.error?.message ?? 'Impossible de charger l’évaluation.'),
    });
  }

  protected noter(critere: CritereGrille, niveau: NiveauCritere): void {
    this.saisie.update((s) => ({ ...s, criteres: { ...s.criteres, [critere.code]: niveau } }));
  }

  protected saisirTexte(champ: ChampTexte, evenement: Event): void {
    const valeur = (evenement.target as HTMLTextAreaElement).value;
    this.saisie.update((s) => ({ ...s, [champ]: valeur }));
  }

  protected saisirDuree(evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement).value;
    this.saisie.update((s) => ({ ...s, dureeEffectiveMois: valeur === '' ? null : Number(valeur) }));
  }

  protected apprecier(valeur: AppreciationGenerale): void {
    this.saisie.update((s) => ({ ...s, appreciationGenerale: valeur }));
  }

  protected donnerAvis(valide: boolean): void {
    this.saisie.update((s) => ({ ...s, avisTuteurValide: valide }));
  }

  protected enregistrer(): void {
    this.executer(this.service.enregistrerEvaluation(this.stageId, this.ecole, this.saisie()), 'Brouillon enregistré.');
  }

  protected demanderSoumission(): void {
    const s = this.saisie();
    if (this.sansReponse() > 0) {
      this.erreur.set(`Notez tous les critères avant de remettre l’évaluation (${this.sansReponse()} sans réponse).`);
      return;
    }
    if (s.dureeEffectiveMois === null || s.appreciationGenerale === null || s.avisTuteurValide === null) {
      this.erreur.set('Indiquez la durée effective, l’appréciation générale et l’avis sur la validation du stage.');
      return;
    }
    this.erreur.set(null);
    this.confirmation.set(true);
  }

  protected soumettre(): void {
    this.confirmation.set(false);
    this.executer(this.service.soumettreEvaluation(this.stageId, this.ecole, this.saisie()),
      'Évaluation remise à l’école. Elle ne peut plus être modifiée.');
  }

  /** Décisions de l'école : chacune passe par une confirmation qui dit ce qu'elle change. */
  protected demanderDecision(decision: Decision): void {
    this.erreur.set(null);
    this.messageDecision.set(null);
    this.decisionDemandee.set(decision);
  }

  protected confirmerDecision(decision: Decision): void {
    this.decisionDemandee.set(null);
    this.changementDecision.set(false);
    if (decision === 'rouvrir') {
      this.executer(this.service.rouvrirEvaluation(this.stageId), 'Évaluation rouverte : le maître de stage peut de nouveau la modifier.');
      return;
    }
    const valide = decision === 'annuler' ? null : decision === 'valider';
    const texte = valide === null ? 'Décision annulée.' : valide ? 'Stage validé.' : 'Stage non validé.';
    this.executer(this.service.deciderStage(this.stageId, valide), texte, true);
  }

  private executer(requete: Observable<Evaluation>, succes: string, decision = false): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    this.message.set(null);
    this.messageDecision.set(null);
    requete.subscribe({
      next: (evaluation) => {
        this.enCours.set(false);
        this.afficher(evaluation);
        (decision ? this.messageDecision : this.message).set(succes);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’enregistrement n’a pas abouti. Réessayez.');
      },
    });
  }

  private afficher(e: Evaluation): void {
    this.evaluation.set(e);
    this.saisie.set({
      criteres: { ...e.criteres }, dureeEffectiveMois: e.dureeEffectiveMois, pointsForts: e.pointsForts ?? '',
      axesAmelioration: e.axesAmelioration ?? '', observations: e.observations ?? '',
      appreciationGenerale: e.appreciationGenerale, avisTuteurValide: e.avisTuteurValide,
    });
  }
}
