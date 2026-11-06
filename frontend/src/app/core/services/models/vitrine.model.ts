/** Ce qu'une personne sans compte voit d'un événement officiel. */
export interface EvenementPublic {
  titre: string;
  lieu: string | null;
  dateDebut: string;
  urlImage: string | null;
}

export interface TemoignagePublic {
  nom: string;
  /** Telle qu'affichée, par exemple « D1994 ». */
  promotion: string | null;
  fonction: string;
  organisation: string | null;
  pays: string | null;
  texte: string;
  urlPhoto: string | null;
}
