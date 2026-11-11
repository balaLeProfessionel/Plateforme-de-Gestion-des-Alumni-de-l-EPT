/** Classe d’un étudiant pour l’année en cours (miroir de l’énumération Classe du serveur). */
export type Classe = 'TC1' | 'TC2' | 'DIC1' | 'DIC2' | 'DIC3' | 'MASTER1' | 'MASTER2' | 'DOCTORAT1' | 'DOCTORAT2' | 'DOCTORAT3';

export const LIBELLES_CLASSE: Record<Classe, string> = {
  TC1: 'TC1', TC2: 'TC2', DIC1: 'DIC1', DIC2: 'DIC2', DIC3: 'DIC3',
  MASTER1: 'Master 1', MASTER2: 'Master 2',
  DOCTORAT1: 'Doctorat 1', DOCTORAT2: 'Doctorat 2', DOCTORAT3: 'Doctorat 3',
};

/** Classes par cycle, pour les listes déroulantes (<optgroup>). */
export const CLASSES_PAR_CYCLE: readonly { cycle: string; classes: readonly Classe[] }[] = [
  { cycle: 'Cycle ingénieur', classes: ['TC1', 'TC2', 'DIC1', 'DIC2', 'DIC3'] },
  { cycle: 'Master', classes: ['MASTER1', 'MASTER2'] },
  { cycle: 'Doctorat', classes: ['DOCTORAT1', 'DOCTORAT2', 'DOCTORAT3'] },
];

/** Libellé d’une classe reçue du serveur, ou null. */
export function libelleClasse(classe: string | null | undefined): string | null {
  return classe && classe in LIBELLES_CLASSE ? LIBELLES_CLASSE[classe as Classe] : null;
}
