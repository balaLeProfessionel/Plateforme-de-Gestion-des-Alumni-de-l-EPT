import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, ElementRef, inject, Injector, OnInit, signal } from '@angular/core';
import { applyEach, FormField, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FilieresService } from '../../../core/services/filieres/filieres';
import {
  COMPETENCES_MAX, DUREE_MAX_MOIS, LIBELLES_TYPE_CONTRAT, LONGUEUR_INTITULE_QUESTION, OffreEmploi, OffreGereeRequete, QUESTIONS_MAX,
  TYPES_CONTRAT, TypeContrat, TypeQuestionOffre,
} from '../../../core/services/models/offre-emploi.model';
import { OffresEmploiService } from '../../../core/services/offres-emploi/offres-emploi';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { dateDans, decouper } from '../outils-formulaire';

interface QuestionSaisie {
  intitule: string;
  type: TypeQuestionOffre;
  obligatoire: boolean;
}

const VIERGE = {
  titre: '', typeContrat: '' as TypeContrat | '', lieu: '', dateExpiration: '', description: '', competences: '',
  filieres: [] as string[], lettreExigee: false, questions: [] as QuestionSaisie[],
};

/**
 * Un organisme publie une offre qui reçoit ses candidatures dans la plateforme (#222), ou la modifie (route
 * `:id/modifier-offre`). Il dit si la lettre de motivation est exigée et pose jusqu’à 5 questions aux candidats.
 */
@Component({
  selector: 'app-formulaire-offre-geree',
  imports: [FormField, RouterLink, BoutonRetour],
  templateUrl: './formulaire-offre-geree.html',
  styleUrl: './formulaire-offre-geree.scss',
})
export class FormulaireOffreGeree implements OnInit {
  private readonly service = inject(OffresEmploiService);
  private readonly router = inject(Router);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Identifiant de l’offre modifiée ; vide pour une nouvelle offre. */
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly types = TYPES_CONTRAT;
  protected readonly libellesType = LIBELLES_TYPE_CONTRAT;
  protected readonly competencesMax = COMPETENCES_MAX;
  protected readonly questionsMax = QUESTIONS_MAX;
  protected readonly filieres = inject(FilieresService).proposees();
  protected readonly dateMin = dateDans(0);
  protected readonly dateMax = dateDans(DUREE_MAX_MOIS);
  protected readonly secours = this.id ? `/offres-emploi/${this.id}` : '/offres-emploi/mes-offres';

  protected readonly modele = signal({ ...VIERGE });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.titre, { message: 'Le titre est obligatoire.' });
    maxLength(champ.titre, 150, { message: '150 caractères au maximum.' });
    required(champ.typeContrat, { message: 'Choisissez le type de contrat.' });
    required(champ.lieu, { message: 'Le lieu est obligatoire.' });
    maxLength(champ.lieu, 150, { message: '150 caractères au maximum.' });
    required(champ.dateExpiration, { message: 'La date d’expiration est obligatoire.' });
    validate(champ.dateExpiration, ({ value }) => {
      if (!value()) return undefined;
      if (value() < this.dateMin) return { kind: 'passee', message: 'La date d’expiration ne peut pas être passée.' };
      return value() > this.dateMax
        ? { kind: 'lointaine', message: `Une offre reste en ligne ${DUREE_MAX_MOIS} mois au plus.` } : undefined;
    });
    required(champ.description, { message: 'Décrivez le poste.' });
    maxLength(champ.description, 5000, { message: '5000 caractères au maximum.' });
    validate(champ.competences, ({ value }) => {
      const liste = decouper(value());
      if (liste.length > COMPETENCES_MAX) return { kind: 'nombre', message: `${COMPETENCES_MAX} compétences au maximum.` };
      return liste.some((c) => c.length > 80) ? { kind: 'longueur', message: '80 caractères au maximum par compétence.' } : undefined;
    });
    applyEach(champ.questions, (question) => {
      required(question.intitule, { message: 'Écrivez la question.' });
      maxLength(question.intitule, LONGUEUR_INTITULE_QUESTION, { message: `${LONGUEUR_INTITULE_QUESTION} caractères au maximum.` });
    });
  });

  protected readonly chargement = signal(false);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly messageErreur = signal<string | null>(null);
  /** Publiée tout de suite, ou en attente : l’organisme n’est pas encore validé par l’école. */
  protected readonly enAttente = signal<OffreEmploi | null>(null);

  ngOnInit(): void {
    if (!this.id) return;
    this.chargement.set(true);
    this.service.detail(this.id).subscribe({
      next: (offre) => {
        this.chargement.set(false);
        if (!offre.modifiable || offre.mode !== 'GEREE') {
          this.erreurChargement.set('Cette offre ne peut plus être modifiée.');
          return;
        }
        this.modele.set(this.versModele(offre));
      },
      error: (erreur: HttpErrorResponse) => {
        this.chargement.set(false);
        this.erreurChargement.set(erreur.status === 404 ? 'Cette offre est introuvable.' : erreur.error?.message ?? 'Impossible de charger l’offre.');
      },
    });
  }

  protected basculerFiliere(id: string, evenement: Event): void {
    const cochee = (evenement.target as HTMLInputElement).checked;
    this.modele.update((m) => ({ ...m, filieres: cochee ? [...m.filieres, id] : m.filieres.filter((f) => f !== id) }));
  }

  protected ajouterQuestion(): void {
    if (this.modele().questions.length >= QUESTIONS_MAX) return;
    this.modele.update((m) => ({ ...m, questions: [...m.questions, { intitule: '', type: 'TEXTE', obligatoire: false }] }));
    this.focaliser(`#question-intitule-${this.modele().questions.length - 1}`);
  }

  protected retirerQuestion(index: number): void {
    this.modele.update((m) => ({ ...m, questions: m.questions.filter((_, i) => i !== index) }));
    this.focaliser('#ajouter-question');
  }

  private focaliser(selecteur: string): void {
    afterNextRender(() => this.hote.nativeElement.querySelector<HTMLElement>(selecteur)?.focus(), { injector: this.injector });
  }

  protected async envoyer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    this.messageErreur.set(null);
    await submit(this.formulaire, {
      action: async () => {
        try {
          const requete = this.versRequete();
          const offre = await firstValueFrom(this.id ? this.service.modifierGeree(this.id, requete) : this.service.publierGeree(requete));
          if (offre.statut === 'SOUMISE' && !this.id) {
            this.enAttente.set(offre);
          } else {
            await this.router.navigate(['/offres-emploi', offre.id]);
          }
        } catch (erreur) {
          this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
            ? erreur.error.message : 'L’enregistrement a échoué. Vérifiez les champs et réessayez.');
        }
        return undefined;
      },
      onInvalid: () => focaliserPremiereErreur(this.hote.nativeElement, this.injector),
    });
  }

  private versRequete(): OffreGereeRequete {
    const s = this.modele();
    return {
      titre: s.titre.trim(), typeContrat: s.typeContrat as TypeContrat, lieu: s.lieu.trim(), dateExpiration: s.dateExpiration,
      description: s.description.trim(), competences: decouper(s.competences), filieres: s.filieres, lettreExigee: s.lettreExigee,
      questions: s.questions.map((q) => ({ intitule: q.intitule.trim(), type: q.type, obligatoire: q.obligatoire })),
    };
  }

  private versModele(offre: OffreEmploi): typeof VIERGE {
    return {
      titre: offre.titre, typeContrat: offre.typeContrat, lieu: offre.lieu, dateExpiration: offre.dateExpiration,
      description: offre.description, competences: offre.competences.join(', '), filieres: offre.filieres.map((f) => f.id),
      lettreExigee: offre.lettreExigee,
      questions: offre.questions.map((q) => ({ intitule: q.intitule, type: q.type, obligatoire: q.obligatoire })),
    };
  }
}
