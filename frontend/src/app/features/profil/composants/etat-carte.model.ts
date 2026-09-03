// Etat d'edition d'une liste de cartes, pilote par la page.
// Il couvre les deux modes d'enregistrement : une seule carte a la fois
// (mode parCarte) ou toutes d'un coup (mode global, ou plusieurs cartes
// peuvent etre en cours et plusieurs messages coexister).
import { MessageSection } from './message-section.model';

export interface EtatCartes {
  // Cles des cartes en cours d'enregistrement ou de suppression
  readonly clesEnCours: readonly string[];
  // Message propre a chaque carte, indexe par cle
  readonly messages: Readonly<Record<string, MessageSection>>;
  // Synthese affichee sous la liste (ex : "2 enregistrees, 1 en echec")
  readonly messageGlobal: MessageSection | null;
}

export const ETAT_CARTES_VIDE: EtatCartes = {
  clesEnCours: [],
  messages: {},
  messageGlobal: null
};

// Raccourci pour le cas courant : une seule carte concernee
export function etatPourCarte(cle: string, message: MessageSection): EtatCartes {
  return { clesEnCours: [], messages: { [cle]: message }, messageGlobal: null };
}

export function etatEnCours(...cles: string[]): EtatCartes {
  return { clesEnCours: cles, messages: {}, messageGlobal: null };
}
