import { Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { LANGUES, NIVEAUX_LANGUE, nomLangue } from '../../../../core/data/langues';
import {
  CompetencesLangues,
  NiveauLangue
} from '../../../../core/services/models/competences.model';
import { LangueExtraite } from '../../../../core/services/models/import-cv.model';
import { MessageSection } from '../message-section.model';

const COMPETENCES_MAX = 30;
const LANGUES_MAX = 15;
const LONGUEUR_COMPETENCE_MAX = 80;

interface LigneLangue {
  cle: number;
  code: string;
  niveau: NiveauLangue | '';
}

/** Ce que le CV apporte, a ajouter a l'existant sans rien retirer. */
export interface CompetencesLanguesCv {
  competences: string[];
  langues: LangueExtraite[];
}

function cleCompetence(libelle: string): string {
  return libelle
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .trim();
}

let compteurLignes = 0;

function versLignes(existant: CompetencesLangues | null, cv: CompetencesLanguesCv | null): LigneLangue[] {
  const lignes: LigneLangue[] = (existant?.langues ?? []).map((l) => ({
    cle: ++compteurLignes,
    code: l.code,
    niveau: l.niveau
  }));
  for (const langue of cv?.langues ?? []) {
    if (!lignes.some((l) => l.code === langue.code)) {
      lignes.push({ cle: ++compteurLignes, code: langue.code, niveau: (langue.niveau as NiveauLangue) ?? '' });
    }
  }
  return lignes;
}

function versCompetences(existant: CompetencesLangues | null, cv: CompetencesLanguesCv | null): string[] {
  const liste = [...(existant?.competences ?? [])];
  const cles = new Set(liste.map(cleCompetence));
  for (const competence of cv?.competences ?? []) {
    const cle = cleCompetence(competence);
    if (cle && !cles.has(cle)) {
      cles.add(cle);
      liste.push(competence);
    }
  }
  return liste.slice(0, COMPETENCES_MAX);
}

// Edite les competences (etiquettes) et les langues (langue + niveau).
// Aucun appel reseau : la page fournit les suggestions et enregistre.
@Component({
  selector: 'app-competences-langues',
  imports: [InputText],
  templateUrl: './competences-langues.html',
  styleUrl: './competences-langues.scss'
})
export class CompetencesLanguesEditeur {
  readonly valeur = input<CompetencesLangues | null>(null);
  readonly prerempli = input<CompetencesLanguesCv | null>(null);
  readonly suggestions = input<string[]>([]);
  readonly enSauvegarde = input(false);
  readonly message = input<MessageSection | null>(null);
  // false : la page porte son propre bouton (« Enregistrer et terminer »)
  readonly afficherBouton = input(true);
  /** « Modifier mon profil » : le bouton n'apparaît qu'une fois la liste modifiée, avec « Annuler ». */
  readonly boutonSiModifie = input(false);

  readonly rechercher = output<string>();
  readonly sauvegarder = output<CompetencesLangues>();

  protected readonly niveaux = NIVEAUX_LANGUE;
  protected readonly competencesMax = COMPETENCES_MAX;
  protected readonly longueurMax = LONGUEUR_COMPETENCE_MAX;

  protected readonly competences = linkedSignal(() => versCompetences(this.valeur(), this.prerempli()));
  protected readonly langues = linkedSignal(() => versLignes(this.valeur(), this.prerempli()));
  protected readonly saisie = signal('');
  protected readonly erreurCompetence = signal<string | null>(null);
  protected readonly erreurLangues = signal<string | null>(null);

  // Une langue lue dans le CV mais absente de la liste reste proposee
  protected readonly languesProposees = computed(() => {
    const codes = new Set(LANGUES.map((l) => l.code));
    const autres = this.langues()
      .filter((l) => l.code && !codes.has(l.code))
      .map((l) => ({ code: l.code, nom: nomLangue(l.code) }));
    return [...LANGUES, ...autres];
  });

  protected readonly modifie = computed(() => {
    const resume = (competences: string[], langues: LigneLangue[]) =>
      JSON.stringify([competences, langues.map((l) => [l.code, l.niveau])]);
    return resume(this.competences(), this.langues()) !== resume(versCompetences(this.valeur(), this.prerempli()), versLignes(this.valeur(), this.prerempli()));
  });

  protected annuler(): void {
    this.competences.set(versCompetences(this.valeur(), this.prerempli()));
    this.langues.set(versLignes(this.valeur(), this.prerempli()));
    this.saisie.set('');
    this.erreurLangues.set(null);
  }

  protected readonly completeParCv = computed(() => {
    const cv = this.prerempli();
    return Boolean(cv && (cv.competences.length > 0 || cv.langues.length > 0));
  });

  protected majSaisie(texte: string): void {
    this.saisie.set(texte);
    this.erreurCompetence.set(null);
    if (texte.trim().length >= 2) {
      this.rechercher.emit(texte.trim());
    }
  }

  protected ajouterCompetence(evenement?: Event): void {
    evenement?.preventDefault();
    const libelle = this.saisie().trim().replace(/\s+/g, ' ');
    if (!libelle) return;
    if (libelle.length > LONGUEUR_COMPETENCE_MAX) {
      this.erreurCompetence.set(`${LONGUEUR_COMPETENCE_MAX} caractères au plus.`);
      return;
    }
    if (this.competences().length >= COMPETENCES_MAX) {
      this.erreurCompetence.set(`${COMPETENCES_MAX} compétences au plus.`);
      return;
    }
    const cle = cleCompetence(libelle);
    if (this.competences().some((c) => cleCompetence(c) === cle)) {
      this.erreurCompetence.set('Cette compétence est déjà dans la liste.');
      return;
    }
    this.competences.update((liste) => [...liste, libelle]);
    this.saisie.set('');
  }

  protected retirerCompetence(index: number): void {
    this.competences.update((liste) => liste.filter((_, i) => i !== index));
  }

  protected ajouterLangue(): void {
    if (this.langues().length >= LANGUES_MAX) return;
    this.langues.update((lignes) => [...lignes, { cle: ++compteurLignes, code: '', niveau: '' }]);
  }

  protected majLangue(cle: number, champ: 'code' | 'niveau', valeur: string): void {
    this.erreurLangues.set(null);
    this.langues.update((lignes) =>
      lignes.map((l) => (l.cle === cle ? { ...l, [champ]: valeur } : l))
    );
  }

  protected retirerLangue(cle: number): void {
    this.langues.update((lignes) => lignes.filter((l) => l.cle !== cle));
  }

  protected nomLangue(code: string): string {
    return nomLangue(code);
  }

  // Publique : la page peut enregistrer depuis son propre bouton.
  // Renvoie false (et affiche l'erreur) si une langue est incomplete.
  valider(): boolean {
    const lignes = this.langues().filter((l) => l.code || l.niveau);
    if (lignes.some((l) => !l.code || !l.niveau)) {
      this.erreurLangues.set('Choisissez la langue et le niveau sur chaque ligne, ou retirez la ligne.');
      return false;
    }
    const codes = lignes.map((l) => l.code);
    if (new Set(codes).size !== codes.length) {
      this.erreurLangues.set('Une même langue apparaît deux fois.');
      return false;
    }
    this.sauvegarder.emit({
      competences: this.competences(),
      langues: lignes.map((l) => ({ code: l.code, niveau: l.niveau as NiveauLangue }))
    });
    return true;
  }
}
