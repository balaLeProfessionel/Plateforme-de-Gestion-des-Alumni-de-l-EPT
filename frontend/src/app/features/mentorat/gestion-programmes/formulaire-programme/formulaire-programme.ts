import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, Injector, computed, inject, signal } from '@angular/core';
import { FormField, applyEach, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { ProgrammeService } from '../../../../core/services/mentorat/programmes';
import {
  LIBELLES_STATUT_PROGRAMME,
  Programme,
  ProgrammeRequest,
  StatutProgramme,
} from '../../../../core/services/models/mentorat.model';
import { BoutonRetour } from '../../../../shared/bouton-retour/bouton-retour';
import { focaliserPremiereErreur } from '../../../../shared/formulaires/focus-premiere-erreur';

const ETAPES_MAX = 10;
/** Résultat d’un appel qui a échoué (une réponse vide, comme un 204, reste un succès). */
const ECHEC = Symbol('echec');

interface SaisieEtape {
  /** null pour une étape pas encore enregistrée. */
  id: string | null;
  titre: string;
  description: string;
}

interface SaisieProgramme {
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  etapes: SaisieEtape[];
}

/** Action de cycle de vie proposée selon le statut, avec ou sans confirmation. */
interface ActionStatut {
  cible: StatutProgramme;
  libelle: string;
  confirmation: string | null;
}

const ACTIONS: Record<StatutProgramme, ActionStatut[]> = {
  BROUILLON: [{ cible: 'OUVERT', libelle: 'Ouvrir le programme', confirmation: null }],
  OUVERT: [
    { cible: 'EN_COURS', libelle: 'Fermer aux nouveaux mentorats', confirmation: null },
    { cible: 'BROUILLON', libelle: 'Repasser en brouillon', confirmation: null },
    { cible: 'CLOS', libelle: 'Clore le programme', confirmation: 'Clore le programme ? Il ne pourra plus être modifié.' },
  ],
  EN_COURS: [
    { cible: 'OUVERT', libelle: 'Rouvrir aux nouveaux mentorats', confirmation: null },
    { cible: 'CLOS', libelle: 'Clore le programme', confirmation: 'Clore le programme ? Il ne pourra plus être modifié.' },
  ],
  CLOS: [],
};

const VIERGE: SaisieProgramme = { titre: '', description: '', dateDebut: '', dateFin: '', etapes: [{ id: null, titre: '', description: '' }] };

/** Créer ou modifier un programme : présentation, période et étapes, puis son cycle de vie. */
@Component({
  selector: 'app-formulaire-programme',
  imports: [FormField, RouterLink, BoutonRetour],
  templateUrl: './formulaire-programme.html',
  styleUrl: './formulaire-programme.scss',
})
export class FormulaireProgramme {
  private readonly programmeService = inject(ProgrammeService);
  private readonly router = inject(Router);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly etapesMax = ETAPES_MAX;
  protected readonly libellesStatut = LIBELLES_STATUT_PROGRAMME;
  protected readonly identifiant = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly programme = signal<Programme | null>(null);
  protected readonly chargement = signal(this.identifiant !== null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly confirmation = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly confirmationSuppression = signal(false);
  /** Action en attente de confirmation (clôture). */
  protected readonly actionAConfirmer = signal<ActionStatut | null>(null);

  protected readonly modele = signal<SaisieProgramme>(structuredClone(VIERGE));
  protected readonly formulaire = form(this.modele, (chemin) => {
    required(chemin.titre, { message: 'Le titre est obligatoire.' });
    maxLength(chemin.titre, 150, { message: '150 caractères au maximum.' });
    maxLength(chemin.description, 4000, { message: '4 000 caractères au maximum.' });
    required(chemin.dateDebut, { message: 'Indiquez la date de début.' });
    required(chemin.dateFin, { message: 'Indiquez la date de fin.' });
    validate(chemin.dateFin, ({ value, valueOf }) => {
      const debut = valueOf(chemin.dateDebut);
      return debut && value() && value() < debut
        ? { kind: 'periode', message: 'La date de fin doit suivre la date de début.' }
        : undefined;
    });
    applyEach(chemin.etapes, (etape) => {
      required(etape.titre, { message: 'Donnez un titre à cette étape.' });
      maxLength(etape.titre, 150, { message: '150 caractères au maximum.' });
      maxLength(etape.description, 500, { message: '500 caractères au maximum.' });
    });
  });

  protected readonly actions = computed(() => {
    const programme = this.programme();
    if (!programme) return [];
    return ACTIONS[programme.statut].filter((action) =>
      action.cible !== 'BROUILLON' || programme.nombreMentorats === 0);
  });
  protected readonly fige = computed(() => this.programme()?.statut === 'CLOS');

  constructor() {
    if (this.identifiant) void this.charger(this.identifiant);
  }

  protected ajouterEtape(): void {
    if (this.modele().etapes.length >= ETAPES_MAX) return;
    this.modele.update((m) => ({ ...m, etapes: [...m.etapes, { id: null, titre: '', description: '' }] }));
  }

  protected retirerEtape(index: number): void {
    this.modele.update((m) => ({ ...m, etapes: m.etapes.filter((_, i) => i !== index) }));
  }

  protected deplacerEtape(index: number, decalage: -1 | 1): void {
    const cible = index + decalage;
    this.modele.update((m) => {
      if (cible < 0 || cible >= m.etapes.length) return m;
      const etapes = [...m.etapes];
      [etapes[index], etapes[cible]] = [etapes[cible], etapes[index]];
      return { ...m, etapes };
    });
  }

  protected async enregistrer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    await submit(this.formulaire, {
      onInvalid: () => focaliserPremiereErreur(this.hote.nativeElement, this.injector),
      action: async () => {
        const programme = await this.executer(this.identifiant
          ? this.programmeService.modifier(this.identifiant, this.requete())
          : this.programmeService.creer(this.requete()));
        if (programme === ECHEC) return undefined;
        if (!this.identifiant) {
          await this.router.navigate(['/mentorat/gestion-programmes', programme.id], { replaceUrl: true });
          return undefined;
        }
        this.appliquer(programme);
        this.confirmation.set('Programme enregistré.');
        return undefined;
      },
    });
  }

  protected async changerStatut(action: ActionStatut): Promise<void> {
    if (action.confirmation && this.actionAConfirmer() !== action) {
      this.actionAConfirmer.set(action);
      return;
    }
    this.actionAConfirmer.set(null);
    const id = this.identifiant;
    if (!id) return;
    const programme = await this.executer(this.programmeService.changerStatut(id, action.cible));
    if (programme === ECHEC) return;
    this.appliquer(programme);
    this.confirmation.set(`Programme désormais « ${LIBELLES_STATUT_PROGRAMME[programme.statut]} ».`);
  }

  protected async supprimer(): Promise<void> {
    const id = this.identifiant;
    if (!id) return;
    const resultat = await this.executer(this.programmeService.supprimer(id));
    if (resultat !== ECHEC) await this.router.navigate(['/mentorat/gestion-programmes'], { replaceUrl: true });
  }

  private async charger(id: string): Promise<void> {
    try {
      this.appliquer(await firstValueFrom(this.programmeService.obtenir(id)));
    } catch (erreur) {
      this.erreurChargement.set(erreur instanceof HttpErrorResponse && erreur.status === 404
        ? 'Ce programme est introuvable ou vous ne pouvez pas le gérer.'
        : 'Impossible de charger le programme.');
    } finally {
      this.chargement.set(false);
    }
  }

  private appliquer(programme: Programme): void {
    this.programme.set(programme);
    this.modele.set({
      titre: programme.titre,
      description: programme.description ?? '',
      dateDebut: programme.dateDebut,
      dateFin: programme.dateFin,
      etapes: programme.etapes.map((etape) => ({ id: etape.id, titre: etape.titre, description: etape.description ?? '' })),
    });
    this.formulaire().reset();
  }

  private requete(): ProgrammeRequest {
    const m = this.modele();
    return {
      titre: m.titre.trim(),
      description: m.description.trim() || null,
      dateDebut: m.dateDebut,
      dateFin: m.dateFin,
      etapes: m.etapes.map((etape) => ({ id: etape.id, titre: etape.titre.trim(), description: etape.description.trim() || null })),
    };
  }

  /** Lance l’appel et affiche l’erreur du serveur ; ECHEC si l’appel a échoué. */
  private async executer<T>(requete: Observable<T>): Promise<T | typeof ECHEC> {
    this.enCours.set(true);
    this.messageErreur.set(null);
    this.confirmation.set(null);
    try {
      return await firstValueFrom(requete, { defaultValue: undefined as T });
    } catch (erreur) {
      this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
        ? erreur.error.message
        : 'L’enregistrement n’a pas abouti. Réessayez.');
      return ECHEC;
    } finally {
      this.enCours.set(false);
    }
  }
}
