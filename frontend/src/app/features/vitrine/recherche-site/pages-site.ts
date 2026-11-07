import { RUBRIQUES_A_VENIR } from '../contenu-vitrine';

export interface PageSite {
  titre: string;
  description: string;
  lien: string;
  fragment?: string;
  precision?: 'À venir' | 'Après connexion';
}

// Ce qu'un visiteur peut chercher sans compte : le contenu des pages réservées aux membres n'y figure pas.
const PAGES_SITE: readonly PageSite[] = [
  { titre: 'Accueil', lien: '/', description: 'Présentation de la plateforme de l’École Polytechnique de Thiès.' },
  {
    titre: 'Sur la plateforme',
    lien: '/',
    fragment: 'plateforme',
    description: 'Annuaire, mentorat, événements et parcours.'
  },
  { titre: 'Actualités', lien: '/', fragment: 'actualites', description: 'Les prochains événements officiels de l’école.' },
  { titre: 'Témoignages', lien: '/', fragment: 'temoignages', description: 'Le parcours de diplômés de l’EPT, racontés par eux-mêmes.' },
  { titre: 'Rejoindre le réseau', lien: '/', fragment: 'rejoindre', description: 'Les étapes de l’inscription et la vérification des comptes.' },
  { titre: 'Annuaire des diplômés', lien: '/annuaire-diplomes', description: 'Retrouver un diplômé de l’EPT par son nom.' },
  {
    titre: 'Tous les événements',
    lien: '/evenements',
    precision: 'Après connexion',
    description: 'Les événements de l’école et des membres.'
  },
  {
    titre: 'Mentorat',
    lien: '/mentorat',
    precision: 'Après connexion',
    description: 'Proposer votre mentorat ou demander celui d’un diplômé, puis planifier vos séances.'
  },
  {
    titre: 'Profil et parcours',
    lien: '/profil',
    precision: 'Après connexion',
    description: 'Vos informations, vos formations et vos expériences.'
  },
  {
    titre: 'Créer un compte',
    lien: '/inscription',
    description: 'Inscription d’un diplômé, d’un membre du personnel, d’un organisme partenaire ou d’un visiteur.'
  },
  { titre: 'Se connecter', lien: '/connexion', description: 'Accéder à votre espace membre.' },
  ...Object.entries(RUBRIQUES_A_VENIR).map(([chemin, rubrique]): PageSite => ({
    titre: rubrique.titre,
    lien: `/${chemin}`,
    precision: 'À venir',
    description: rubrique.description
  }))
];

/** Sans accents ni ponctuation : « Evenement » trouve « Événements », et « d’emploi » trouve « emploi ». */
function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** Toutes les pages qui contiennent tous les mots saisis, celles dont le titre correspond en premier. */
export function chercherPages(recherche: string): PageSite[] {
  const mots = normaliser(recherche).split(' ').filter(Boolean);
  if (!mots.length) return [];

  const contient = (texte: string) => mots.every((mot) => normaliser(texte).includes(mot));
  const trouvees = PAGES_SITE.filter((page) => contient(`${page.titre} ${page.description}`));
  return [...trouvees.filter((page) => contient(page.titre)), ...trouvees.filter((page) => !contient(page.titre))];
}
