// Etat d'edition d'une liste de cartes, pilote par la page.
// Les sauvegardes etant faites carte par carte, une seule est en cours a la
// fois : une seule cle suffit pour cibler le retour visuel.
import { MessageSection } from './message-section.model';

export interface EtatCartes {
  // Cle de la carte en cours d'enregistrement ou de suppression
  cleEnCours: string | null;
  // Cle de la carte concernee par le message
  cleMessage: string | null;
  message: MessageSection | null;
}

export const ETAT_CARTES_VIDE: EtatCartes = {
  cleEnCours: null,
  cleMessage: null,
  message: null
};
