import { Mentor, Mentorat, MentoratDetail, Page, SeanceMentorat } from '../../../core/services/models/mentorat.model';

/** Données de test partagées par les specs du mentorat. */
export function unMentor(valeurs: Partial<Mentor> = {}): Mentor {
  return {
    profilId: 'p1', utilisateurId: 'u1', nom: 'Diop', prenom: 'Awa', urlPhoto: null,
    posteActuel: 'Data Engineer', filiere: 'Génie Informatique', anneeSortie: 2016,
    presentation: 'J’aide à préparer les stages.',
    domaines: [{ id: 'd1', code: 'DATA_IA', libelle: 'Data & IA' }],
    disponible: true, placesRestantes: 2, demandeEnCours: false,
    ...valeurs,
  };
}

export function unMentorat(valeurs: Partial<Mentorat> = {}): Mentorat {
  return {
    id: 'm1',
    statut: 'EN_ATTENTE',
    domaine: { id: 'd1', code: 'DATA_IA', libelle: 'Data & IA' },
    objectif: 'Préparer mon stage',
    motifRefus: null,
    creeLe: '2026-10-02T10:00:00Z',
    reponduLe: null,
    clotureLe: null,
    mentor: { id: 'u1', nom: 'Diop', prenom: 'Awa', urlPhoto: null, posteActuel: 'Data Engineer', filiere: null, anneeSortie: 2016 },
    mentore: { id: 'u2', nom: 'Ndiaye', prenom: 'Moussa', urlPhoto: null, posteActuel: null, filiere: 'GIT', anneeSortie: 2027 },
    monRole: 'MENTOR',
    programme: null,
    ...valeurs,
  };
}

export function uneSeance(valeurs: Partial<SeanceMentorat> = {}): SeanceMentorat {
  return {
    id: 's1', debut: '2026-10-28T18:00:00Z', dureeMinutes: 45, modalite: 'VISIO',
    lieuOuLien: 'https://meet.example.test/a', statut: 'PLANIFIEE', compteRendu: null, proposeeParId: 'u1',
    ...valeurs,
  };
}

export function unDetail(valeurs: Partial<MentoratDetail> = {}): MentoratDetail {
  return { mentorat: unMentorat(), seances: [], evaluations: [], peutEvaluer: false, ...valeurs };
}

export function unePage<T>(contenu: T[]): Page<T> {
  return { contenu, page: 0, taille: 12, totalElements: contenu.length, totalPages: 1 };
}

/** jsdom n'implémente pas la fenêtre modale native. */
export function simulerDialogue(): void {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

export function saisir(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, valeur: string): void {
  element.value = valeur;
  element.dispatchEvent(new Event('input'));
  if (element instanceof HTMLSelectElement) element.dispatchEvent(new Event('change'));
}

export function soumettre(formulaire: HTMLFormElement): void {
  formulaire.dispatchEvent(new Event('submit', { cancelable: true }));
}
