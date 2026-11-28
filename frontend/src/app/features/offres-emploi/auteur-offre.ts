import { AuteurOffre } from '../../core/services/models/offre-emploi.model';

/** « Awa Diop, promo 2019 » : qui a relayé l’offre, avec sa promotion quand elle est connue. */
export function presenterAuteur(auteur: AuteurOffre): string {
  const nom = [auteur.prenom, auteur.nom].filter(Boolean).join(' ');
  if (auteur.role === 'ALUMNI' && auteur.anneeSortie) return `${nom}, promo ${auteur.anneeSortie}`;
  if (auteur.role === 'ETUDIANT') return `${nom}, étudiant${auteur.filiere ? ` en ${auteur.filiere}` : ''}`;
  if (auteur.role === 'PERSONNEL') return `${nom}, personnel de l’EPT`;
  return nom;
}
