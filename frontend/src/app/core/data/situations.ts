import { SituationActuelle } from '../services/models/profil.model';

export const SITUATIONS: readonly { valeur: SituationActuelle; libelle: string }[] = [
  { valeur: 'EN_POSTE', libelle: 'En poste' },
  { valeur: 'EN_RECHERCHE', libelle: 'En recherche d’emploi' },
  { valeur: 'EN_ETUDES', libelle: 'En études' },
  { valeur: 'ENTREPRENEUR', libelle: 'Entrepreneur ou indépendant' },
  { valeur: 'AUTRE', libelle: 'Autre' }
];

export function libelleSituation(situation: string | null): string | null {
  if (!situation) return null;
  return SITUATIONS.find((s) => s.valeur === situation)?.libelle ?? null;
}
