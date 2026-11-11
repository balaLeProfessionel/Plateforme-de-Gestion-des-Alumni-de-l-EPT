import { DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import {
  ClausesConvention, Convention, LIBELLES_CONVENTION, LONGUEUR_CLAUSE, PartieConvention, POIDS_MAX_PIECE,
} from '../../../core/services/models/stage.model';
import { SuiviStagesService } from '../../../core/services/stages/suivi-stages';
import { enregistrerFichier } from '../../../shared/telecharger';
import { FicheSuivi } from '../../stages/fiche-suivi/fiche-suivi';
import { PageAdmin } from '../page-admin/page-admin';

type ChampClause = 'assurance' | 'indemnite' | 'logement';

/**
 * Convention tripartite d’un stage confirmé (STA-05). L’administrateur Stages saisit les clauses, enregistre la date
 * de chaque signature sur papier et dépose le scan signé ; la convention est complète quand tout est enregistré.
 */
@Component({
  selector: 'app-convention-stage',
  imports: [DatePipe, FicheSuivi, PageAdmin],
  templateUrl: './convention-stage.html',
  styleUrls: ['../etats-admin.scss', '../formulaire-admin.scss', './convention-stage.scss'],
})
export class ConventionStagePage {
  private readonly service = inject(SuiviStagesService);
  private readonly document = inject(DOCUMENT);
  private readonly stageId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly parents = [{ libelle: 'Suivi des stages', lien: '/admin/stages/suivi' }];
  protected readonly libelles = LIBELLES_CONVENTION;
  protected readonly longueur = LONGUEUR_CLAUSE;
  protected readonly parties: { valeur: PartieConvention; libelle: string; champ: 'signeeEtudiantLe' | 'signeeOrganismeLe' | 'signeeEcoleLe' }[] = [
    { valeur: 'ETUDIANT', libelle: 'Étudiant', champ: 'signeeEtudiantLe' },
    { valeur: 'ORGANISME', libelle: 'Organisme d’accueil', champ: 'signeeOrganismeLe' },
    { valeur: 'ECOLE', libelle: 'École', champ: 'signeeEcoleLe' },
  ];

  protected readonly convention = signal<Convention | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly clauses = signal<ClausesConvention>({ assurance: '', indemnite: '', logement: '', clauseConfidentialite: false });
  protected readonly dates = signal<Record<PartieConvention, string>>({ ETUDIANT: '', ORGANISME: '', ECOLE: '' });
  protected readonly enCours = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly aujourdhui = new Date().toLocaleDateString('sv-SE');
  protected readonly titre = computed(() => {
    const c = this.convention();
    return c ? `Convention de ${c.stage.etudiant.prenom} ${c.stage.etudiant.nom}` : 'Convention de stage';
  });

  constructor() {
    this.service.convention(this.stageId).pipe(takeUntilDestroyed()).subscribe({
      next: (convention) => this.afficher(convention),
      error: (erreur: HttpErrorResponse) => this.erreurChargement.set(erreur.status === 404
        ? 'Ce stage n’existe pas ou n’est pas confirmé.' : erreur.error?.message ?? 'Impossible de charger la convention.'),
    });
  }

  protected saisirClause(champ: ChampClause, evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.clauses.update((c) => ({ ...c, [champ]: valeur }));
  }

  protected basculerConfidentialite(evenement: Event): void {
    const coche = (evenement.target as HTMLInputElement).checked;
    this.clauses.update((c) => ({ ...c, clauseConfidentialite: coche }));
  }

  protected saisirDate(partie: PartieConvention, evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement).value;
    this.dates.update((d) => ({ ...d, [partie]: valeur }));
  }

  protected enregistrerClauses(): void {
    this.executer(this.service.enregistrerClauses(this.stageId, this.clauses()), 'Clauses enregistrées.');
  }

  protected signer(partie: PartieConvention, libelle: string): void {
    const date = this.dates()[partie];
    if (!date) {
      this.erreur.set(`Indiquez la date de signature (${libelle}).`);
      return;
    }
    if (date > this.aujourdhui) {
      this.erreur.set('La date de signature ne peut pas être dans le futur.');
      return;
    }
    this.executer(this.service.signer(this.stageId, partie, date), `Signature enregistrée (${libelle}).`);
  }

  protected retirerSignature(partie: PartieConvention, libelle: string): void {
    this.executer(this.service.signer(this.stageId, partie, null), `Signature retirée (${libelle}).`);
  }

  protected deposerScan(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0] ?? null;
    champ.value = '';
    this.erreur.set(null);
    if (!fichier) return;
    if (fichier.type !== 'application/pdf' || !fichier.name.toLowerCase().endsWith('.pdf')) {
      this.erreur.set('Le scan doit être un fichier PDF.');
      return;
    }
    if (fichier.size > POIDS_MAX_PIECE) {
      this.erreur.set('Le scan ne doit pas dépasser 5 Mo.');
      return;
    }
    this.executer(this.service.deposerScan(this.stageId, fichier), 'Scan de la convention signée déposé.');
  }

  protected telechargerScan(nom: string): void {
    this.service.telechargerScan(this.stageId).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, nom),
      error: () => this.erreur.set('Le scan n’a pas pu être téléchargé. Réessayez.'),
    });
  }

  private executer(requete: Observable<Convention>, succes: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    this.message.set(null);
    requete.subscribe({
      next: (convention) => {
        this.enCours.set(false);
        this.afficher(convention);
        this.message.set(convention.etat === 'COMPLETE' ? `${succes} La convention est complète.` : succes);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’enregistrement n’a pas abouti. Réessayez.');
      },
    });
  }

  private afficher(c: Convention): void {
    this.convention.set(c);
    this.clauses.set({ assurance: c.assurance ?? '', indemnite: c.indemnite ?? '', logement: c.logement ?? '', clauseConfidentialite: c.clauseConfidentialite });
    this.dates.set({ ETUDIANT: c.signeeEtudiantLe ?? '', ORGANISME: c.signeeOrganismeLe ?? '', ECOLE: c.signeeEcoleLe ?? '' });
  }
}
