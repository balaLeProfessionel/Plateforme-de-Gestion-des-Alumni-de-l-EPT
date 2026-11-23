import { Accord, Convention } from '../../../core/services/models/partenariat.model';

/** Données des tests des partenariats : une convention et un accord, à ajuster par test. */
export function uneConvention(changement: Partial<Convention> = {}): Convention {
  return {
    id: 'c1', organismeId: 'o1', organismeNom: 'Sonatel', organismeLogoUrl: null, objet: 'Coopération en formation', domaines: 'Stages',
    message: 'Nous souhaitons accueillir des étudiants.', statut: 'DEMANDEE', origine: 'ORGANISME', dateSignature: null, dateDebut: null,
    dateFin: null, joursRestants: null, expireBientot: false, motifDecision: null, creeeLe: '2026-11-01T10:00:00Z',
    modifieeLe: '2026-11-01T10:00:00Z', pieces: [], ...changement,
  };
}

export function unAccord(changement: Partial<Accord> = {}): Accord {
  return {
    id: 'a1', organismeId: 'o1', organismeNom: 'Sonatel', conventionId: null, conventionObjet: null, type: 'STAGE', proposePar: 'ECOLE',
    objet: 'Stages de fin d’études', description: null, nombrePlaces: 5, filieres: [], dateDebut: '2027-01-01', dateFin: '2028-01-01',
    statut: 'PROPOSE', motifDecision: null, resiliationDemandeePar: null, resiliationDemandeeLe: null, dateEffetResiliation: null,
    aRepondre: true, modifiable: false, resiliable: false, creeLe: '2026-11-01T10:00:00Z', modifieLe: '2026-11-01T10:00:00Z',
    pieces: [], ...changement,
  };
}
