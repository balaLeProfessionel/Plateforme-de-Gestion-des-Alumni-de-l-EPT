import { MembreOrganisme } from '../../../core/services/models/organisme.model';

/** « Depuis 2019 », « 2018 – 2023 » ou « En 2021 » : la présence d'un membre dans l'organisme. */
export function periodeMembre(membre: MembreOrganisme): string {
  if (membre.actuel) return membre.anneeDebut ? `Depuis ${membre.anneeDebut}` : 'En poste';
  if (membre.anneeDebut && membre.anneeFin && membre.anneeDebut !== membre.anneeFin) {
    return `${membre.anneeDebut} – ${membre.anneeFin}`;
  }
  const annee = membre.anneeFin ?? membre.anneeDebut;
  return annee ? `En ${annee}` : 'Ancien poste';
}
