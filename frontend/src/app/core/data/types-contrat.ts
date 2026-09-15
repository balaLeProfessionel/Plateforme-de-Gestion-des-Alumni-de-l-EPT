import { TypeContrat } from '../services/models/profil.model';

export const TYPES_CONTRAT: ReadonlyArray<{ label: string; value: TypeContrat }> = [
  { label: 'CDI', value: 'CDI' },
  { label: 'CDD', value: 'CDD' },
  { label: 'Stage', value: 'STAGE' },
  { label: 'Freelance', value: 'FREELANCE' },
  { label: 'Fonction publique', value: 'FONCTION_PUBLIQUE' }
];
