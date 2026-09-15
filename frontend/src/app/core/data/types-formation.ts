import { TypeFormation } from '../services/models/profil.model';

export const TYPES_FORMATION: ReadonlyArray<{ label: string; value: TypeFormation }> = [
  { label: 'Formation diplômante', value: 'DIPLOMANTE' },
  { label: 'Certification', value: 'CERTIFICATION' },
  { label: 'Séminaire', value: 'SEMINAIRE' },
  { label: 'Autre', value: 'AUTRE' }
];
