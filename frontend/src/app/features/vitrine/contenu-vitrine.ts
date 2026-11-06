// Contenu statique de la page publique, en attendant une route publique de l'API.

export interface ChiffreCle {
  /** Classe PrimeIcons. */
  icone: string;
  /** `null` : module pas encore livré, affiché « À venir ». */
  valeur: number | null;
  libelle: string;
}

export interface FonctionnalitePlateforme {
  /** Classe PrimeIcons. */
  icone: string;
  titre: string;
  description: string;
  action: string;
  lien: string;
  fragment?: string;
}

export interface EtapeAdhesion {
  titre: string;
  description: string;
}

export interface LienEcole {
  nom: string;
  /** Classe PrimeIcons. */
  icone: string;
  url: string;
}

// Relevés dans le pied de page de ept.edu.sn le 29/10/2026.
export const LIENS_ECOLE: readonly LienEcole[] = [
  {
    nom: 'LinkedIn',
    icone: 'pi pi-linkedin',
    url: 'https://www.linkedin.com/in/ecole-polytechnique-thi%C3%A8s-l%E2%80%99officiel-b32426147/'
  },
  { nom: 'Facebook', icone: 'pi pi-facebook', url: 'https://www.facebook.com/eptthies' },
  { nom: 'YouTube', icone: 'pi pi-youtube', url: 'https://www.youtube.com/@eptchaineofficielle7189' },
  { nom: 'E-mail', icone: 'pi pi-envelope', url: 'mailto:contact@ept.sn' }
];

export const SITE_ECOLE = 'https://ept.edu.sn';

// Source unique de l'accueil et de la connexion. Valeurs provisoires : à confirmer par l'école
// ou à brancher sur le backend avant la mise en ligne.
export const CHIFFRES_CLES: readonly ChiffreCle[] = [
  { icone: 'pi pi-flag', valeur: 43, libelle: 'Nationalités' },
  { icone: 'pi pi-graduation-cap', valeur: 3727, libelle: 'Alumni' },
  { icone: 'pi pi-users', valeur: null, libelle: 'Offres d’emploi' },
  { icone: 'pi pi-thumbs-up', valeur: 200, libelle: 'Fans' }
];

export const FONCTIONNALITES: readonly FonctionnalitePlateforme[] = [
  {
    icone: 'pi pi-search',
    titre: 'Annuaire',
    description: 'Retrouvez un diplômé par son nom, sans compte. Après connexion, filtrez par filière, promotion ou ville et consultez les profils.',
    action: 'Rechercher un diplômé',
    lien: '/annuaire-diplomes'
  },
  {
    icone: 'pi pi-sitemap',
    titre: 'Mentorat',
    description: 'Proposez votre mentorat ou demandez celui d’un diplômé, puis planifiez vos séances.',
    action: 'Se connecter pour y accéder',
    lien: '/mentorat'
  },
  {
    icone: 'pi pi-calendar',
    titre: 'Événements',
    description: 'Consultez les événements de l’école et des membres, indiquez votre participation ou publiez le vôtre.',
    action: 'Voir les prochains événements',
    lien: '/',
    fragment: 'actualites'
  },
  {
    icone: 'pi pi-briefcase',
    titre: 'Parcours',
    description: 'Renseignez vos formations et vos expériences : elles composent le parcours affiché sur votre profil.',
    action: 'Créer mon compte',
    lien: '/inscription'
  }
];

// Mêmes étapes que l'inscription : choix du rôle, code reçu par e-mail, complétion du profil.
export const ETAPES_ADHESION: readonly EtapeAdhesion[] = [
  {
    titre: 'Choisissez votre profil',
    description: 'Diplômé, personnel de l’EPT, organisme partenaire ou visiteur. Les comptes étudiants sont créés par l’administration.'
  },
  {
    titre: 'Confirmez votre e-mail',
    description: 'Saisissez le code de vérification envoyé à cette adresse.'
  },
  {
    titre: 'Complétez votre profil',
    description: 'Ajoutez vos formations et vos expériences pour apparaître dans l’annuaire.'
  }
];

export interface RubriqueAVenir {
  titre: string;
  description: string;
  enAttendant: string;
}

// Modules du sujet et du backlog sans écran à ce jour : aucune date n'est annoncée. La clé est le chemin de la route.
export const RUBRIQUES_A_VENIR = {
  messagerie: {
    titre: 'Messagerie et espace communautaire',
    description: 'Elle permettra aux membres d’échanger entre eux et avec l’école.',
    enAttendant: 'En attendant, vous pouvez retrouver un diplômé dans l’annuaire.'
  },
  partenariats: {
    titre: 'Partenariats de l’école',
    description: 'Elle présentera les partenariats de l’école et les organismes avec lesquels elle collabore.',
    enAttendant: 'En attendant, un organisme partenaire peut déjà créer son compte.'
  },
  conventions: {
    titre: 'Conventions',
    description: 'Elle permettra de suivre les conventions cadre, de stage et de mobilité.',
    enAttendant: 'En attendant, un organisme partenaire peut déjà créer son compte.'
  },
  stages: {
    titre: 'Stages',
    description: 'Elle permettra de suivre les stages : demandes, conventions et encadrement.',
    enAttendant: 'En attendant, vous pouvez proposer ou demander un mentorat après connexion.'
  },
  insertion: {
    titre: 'Insertion professionnelle',
    description: 'Elle présentera les statistiques d’insertion professionnelle des diplômés de l’école.',
    enAttendant: 'En attendant, vous pouvez retrouver un diplômé dans l’annuaire.'
  },
  mobilites: {
    titre: 'Mobilités',
    description: 'Elle centralisera les demandes de mobilité de stage, de crédit, de recherche et d’enseignant-chercheur.',
    enAttendant: 'En attendant, vous pouvez proposer ou demander un mentorat après connexion.'
  },
  'offres-emploi': {
    titre: 'Offres d’emploi',
    description: 'Elle présentera les offres d’emploi proposées aux diplômés.',
    enAttendant: 'En attendant, vous pouvez proposer ou demander un mentorat après connexion.'
  },
  'publier-offre': {
    titre: 'Publier une offre',
    description: 'Elle permettra aux organismes partenaires de publier leurs offres d’emploi.',
    enAttendant: 'En attendant, un organisme partenaire peut déjà créer son compte.'
  }
} satisfies Record<string, RubriqueAVenir>;

export interface LienRubrique {
  libelle: string;
  lien: string;
  fragment?: string;
  /** Précision affichée sous le libellé, pour ne pas présenter comme disponible ce qui ne l'est pas. */
  precision?: 'À venir' | 'Après connexion';
}

export interface MenuRubrique {
  id: string;
  libelle: string;
  liens: readonly LienRubrique[];
}

export const MENUS_ENTETE: readonly MenuRubrique[] = [
  {
    id: 'communaute',
    libelle: 'Communauté',
    liens: [
      { libelle: 'Annuaire des diplômés', lien: '/annuaire-diplomes' },
      { libelle: 'Mentorat', lien: '/mentorat', precision: 'Après connexion' },
      { libelle: 'Messagerie et espace communautaire', lien: '/messagerie', precision: 'À venir' }
    ]
  },
  {
    id: 'actualite',
    libelle: 'Actualité',
    liens: [
      { libelle: 'Prochains événements', lien: '/', fragment: 'actualites' },
      { libelle: 'Tous les événements', lien: '/evenements', precision: 'Après connexion' }
    ]
  },
  {
    id: 'carriere',
    libelle: 'Carrière',
    liens: [
      { libelle: 'Stages', lien: '/stages', precision: 'À venir' },
      { libelle: 'Mobilités', lien: '/mobilites', precision: 'À venir' },
      { libelle: 'Insertion professionnelle', lien: '/insertion', precision: 'À venir' }
    ]
  },
  {
    id: 'offres',
    libelle: 'Offres d’emploi',
    liens: [
      { libelle: 'Consulter les offres', lien: '/offres-emploi', precision: 'À venir' },
      { libelle: 'Publier une offre', lien: '/publier-offre', precision: 'À venir' }
    ]
  },
  {
    id: 'partenariats',
    libelle: 'Partenariats',
    liens: [
      { libelle: 'Partenariats de l’école', lien: '/partenariats', precision: 'À venir' },
      { libelle: 'Conventions', lien: '/conventions', precision: 'À venir' },
      { libelle: 'Créer un compte organisme', lien: '/inscription' }
    ]
  }
];
