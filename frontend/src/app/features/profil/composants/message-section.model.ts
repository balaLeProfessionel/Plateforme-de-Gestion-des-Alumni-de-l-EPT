// Retour visuel qu'une page pilote pour une section de profil.
// Il est passe en input() aux composants de presentation : le message
// s'affiche pres du bouton concerne, sans que le composant sache
// d'ou il vient ni qu'un appel reseau existe.
export interface MessageSection {
  type: 'succes' | 'erreur';
  texte: string;
}
