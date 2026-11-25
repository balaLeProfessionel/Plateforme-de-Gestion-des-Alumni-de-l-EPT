import {
  ExperienceExtraite,
  FormationExtraite,
  ProfilExtrait
} from '../../../core/services/models/import-cv.model';
import { Experience, Formation } from '../../../core/services/models/profil.model';

// Carte de formation ou d'experience pre-remplie depuis un CV, pas encore
// enregistree. Les valeurs sont deja au format des champs du formulaire.
export interface ParcoursPrerempli {
  intitule: string;
  nomOrganisme: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  enCours: boolean;
  estStage: boolean;
  description: string;
  /** Le CV ne donnait que l'annee : le mois est a verifier. */
  dateApproximative: boolean;
}

interface DateChamp {
  valeur: string;
  approximative: boolean;
}

/** « 2018-03 » donne le 1er mars 2018 ; « 2018 » donne le 1er janvier, a verifier. */
export function dateVersChamp(date: string | null): DateChamp {
  if (!date) return { valeur: '', approximative: false };
  if (/^\d{4}-\d{2}$/.test(date)) return { valeur: `${date}-01`, approximative: false };
  if (/^\d{4}$/.test(date)) return { valeur: `${date}-01-01`, approximative: true };
  return { valeur: '', approximative: false };
}

function normaliser(texte: string | null | undefined): string {
  return (texte ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function versCarte(
  intitule: string,
  nomOrganisme: string | null,
  type: string | null,
  debut: string | null,
  fin: string | null,
  enCours: boolean | null,
  estStage: boolean,
  description: string | null
): ParcoursPrerempli {
  const dateDebut = dateVersChamp(debut);
  const dateFin = dateVersChamp(fin);
  return {
    intitule,
    nomOrganisme: nomOrganisme ?? '',
    type: type ?? '',
    dateDebut: dateDebut.valeur,
    dateFin: enCours ? '' : dateFin.valeur,
    enCours: Boolean(enCours),
    estStage,
    description: description ?? '',
    dateApproximative: dateDebut.approximative || (!enCours && dateFin.approximative)
  };
}

/** Formations du CV absentes du profil (meme intitule et meme etablissement). */
export function formationsPreremplies(
  profil: ProfilExtrait | null,
  existantes: readonly Formation[]
): ParcoursPrerempli[] {
  if (!profil) return [];
  const connues = new Set(existantes.map((f) => `${normaliser(f.libelle)}|${normaliser(f.nomOrganisme)}`));
  return profil.formations
    .filter((f: FormationExtraite) => !connues.has(`${normaliser(f.libelle)}|${normaliser(f.etablissement)}`))
    .map((f) =>
      versCarte(f.libelle, f.etablissement, f.typeFormation, f.dateDebut, f.dateFin, f.enCours, false, f.description)
    );
}

/** Experiences du CV absentes du profil (meme poste et meme organisme). */
export function experiencesPreremplies(
  profil: ProfilExtrait | null,
  existantes: readonly Experience[]
): ParcoursPrerempli[] {
  if (!profil) return [];
  const connues = new Set(existantes.map((e) => `${normaliser(e.poste)}|${normaliser(e.nomOrganisme)}`));
  return profil.experiences
    .filter((e: ExperienceExtraite) => !connues.has(`${normaliser(e.poste)}|${normaliser(e.organisme)}`))
    .map((e) =>
      versCarte(
        e.poste,
        e.organisme,
        e.typeContrat,
        e.dateDebut,
        e.dateFin,
        e.enCours,
        Boolean(e.estStage),
        e.description
      )
    );
}
