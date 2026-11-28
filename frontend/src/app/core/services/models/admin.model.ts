import { Classe } from './classe.model';

export type StatutCompte = 'EN_ATTENTE' | 'ACTIF' | 'SUSPENDU';
export type RoleCompte = 'ETUDIANT' | 'ALUMNI' | 'PERSONNEL' | 'ORGANISME' | 'ADMIN' | 'VISITEUR';
export type TypeActionAdmin = 'VALIDATION_INSCRIPTION' | 'REFUS_INSCRIPTION' | 'SUSPENSION' | 'REACTIVATION'
  | 'CREATION_COMPTE' | 'CHANGEMENT_ROLE' | 'DIPLOMATION' | 'MODIFICATION_IDENTITE' | 'MODIFICATION_RESPONSABILITES'
  | 'DESIGNATION_CHEF_DEPARTEMENT' | 'RETRAIT_CHEF_DEPARTEMENT' | 'MODIFICATION_CLASSE'
  | 'PUBLICATION_OFFRE_EMPLOI' | 'REFUS_OFFRE_EMPLOI' | 'RETRAIT_OFFRE_EMPLOI' | 'CLASSEMENT_SIGNALEMENTS_OFFRE_EMPLOI';

/** Miroir de CompteAdminResponse : un compte vu par l’administration, coordonnées comprises. */
export interface CompteAdmin {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  role: RoleCompte;
  statutCompte: StatutCompte;
  filiere: string | null;
  /** Code de la classe (DIC1, MASTER2…), pour un étudiant. */
  classe: Classe | null;
  anneeEntree: number | null;
  anneeSortie: number | null;
  nomOrganisme: string | null;
  organismeId: string | null;
  urlPhoto: string | null;
  dateCreation: string;
  motifSuspension: string | null;
  nombreDecisions: number;
}

export interface ResumeComptes {
  enAttente: number;
  actifs: number;
  suspendus: number;
  enAttenteParRole: Partial<Record<RoleCompte, number>>;
}

export interface ActionAdmin {
  id: string;
  type: TypeActionAdmin;
  motif: string | null;
  /** Ce qui a changé (« ALUMNI → ADMIN », « Promotion 2026 »), ou null. */
  details: string | null;
  dateAction: string;
  auteur: string;
}

export interface CriteresComptes {
  recherche: string;
  role: RoleCompte | null;
  statut: StatutCompte | null;
  /** Promotion d’entrée et filière (page Diplômés) ; « sans » cible les comptes où le champ est vide. */
  anneeEntree?: number | null;
  sansAnneeEntree?: boolean;
  filiere?: string | null;
  sansFiliere?: boolean;
  /** Classe (passage annuel) ; « sansClasse » cible les étudiants sans classe renseignée. */
  classe?: Classe | null;
  sansClasse?: boolean;
}

/** Rôles qu’on peut créer ou attribuer depuis l’administration (un organisme a sa propre inscription). */
export type RoleAttribuable = Exclude<RoleCompte, 'ORGANISME'>;
export const ROLES_ATTRIBUABLES: readonly RoleAttribuable[] = ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'VISITEUR', 'ADMIN'];

export interface CreationCompte {
  prenom: string;
  nom: string;
  email: string;
  role: RoleAttribuable;
  filiere: string | null;
  anneeEntree: number | null;
  anneeSortie: number | null;
  /** Pour un étudiant seulement. */
  classe: Classe | null;
}

export interface CompteCree {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: RoleCompte;
  motDePasseTemporaire: string;
}

export interface LigneImport {
  prenom: string;
  nom: string;
  email: string;
  filiere: string | null;
  anneeEntree: number | null;
  anneeSortie: number | null;
  /** Texte du fichier (« DIC1 », « Master 2 »…), interprété par le serveur. */
  classe: string | null;
}

export interface ResultatImport {
  crees: number;
  lignes: { numero: number; email: string; creee: boolean; message: string | null; id: string | null; motDePasseTemporaire: string | null }[];
}

export interface ResultatDiplomation {
  diplomes: number;
  ignores: { id: string; nom: string | null; raison: string }[];
}

/** Miroir de ClasseEtudianteResponse : étudiants d’une classe et d’une filière (null : non renseignée). */
export interface ClasseEtudiante {
  classe: Classe | null;
  filiere: string | null;
  nombre: number;
}

export interface ResultatPassage {
  passes: number;
  ignores: { id: string; nom: string | null; raison: string }[];
}

export interface PromotionEtudiante {
  anneeEntree: number | null;
  filiere: string | null;
  nombre: number;
}

/** Nom affiché d’un compte : un contact d’organisme n’a pas toujours de prénom. */
export function nomDuCompte(compte: Pick<CompteAdmin, 'prenom' | 'nom' | 'email'>): string {
  return [compte.prenom, compte.nom].map((partie) => partie?.trim()).filter(Boolean).join(' ') || compte.email;
}

/** Longueur maximale d’un motif, identique à la validation du serveur. */
export const MOTIF_LONGUEUR_MAX = 500;

/** Rôles dont la fiche publique est un profil de membre (/profil/:id). */
const ROLES_AVEC_PROFIL: readonly RoleCompte[] = ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'VISITEUR'];

/** Page publique qui permet de vérifier un compte, ou null s’il n’en a pas (admin, compte suspendu). */
export function lienFicheCompte(compte: CompteAdmin): string[] | null {
  if (compte.statutCompte === 'SUSPENDU') return null;
  if (compte.role === 'ORGANISME') return compte.organismeId ? ['/organismes', compte.organismeId] : null;
  return ROLES_AVEC_PROFIL.includes(compte.role) ? ['/profil', compte.id] : null;
}

/**
 * Miroir de PermissionAdmin : chaque rubrique de l’administration exige l’une d’elles. Le tableau de bord est
 * ouvert à tout administrateur ; les autres sont les responsabilités que le super administrateur coche.
 */
export type PermissionAdmin = 'CONSULTER_TABLEAU_DE_BORD' | 'GERER_COMPTES' | 'CONSULTER_JOURNAL'
  | 'PUBLIER_ANNONCES' | 'MODERER_PUBLICATIONS' | 'GERER_STAGES'
  | 'GERER_MOBILITES' | 'GERER_PARTENARIATS' | 'GERER_EVENEMENTS' | 'GERER_MENTORAT' | 'GERER_ADMINISTRATEURS' | 'GERER_COMMUNAUTES'
  | 'GERER_OFFRES_EMPLOI';
export const TOUTES_LES_PERMISSIONS: readonly PermissionAdmin[] = [
  'CONSULTER_TABLEAU_DE_BORD', 'GERER_COMPTES', 'CONSULTER_JOURNAL',
  'PUBLIER_ANNONCES', 'MODERER_PUBLICATIONS', 'GERER_STAGES', 'GERER_MOBILITES',
  'GERER_PARTENARIATS', 'GERER_EVENEMENTS', 'GERER_MENTORAT', 'GERER_COMMUNAUTES', 'GERER_OFFRES_EMPLOI', 'GERER_ADMINISTRATEURS',
];
/** Permissions d’une session ouverte avant leur envoi par le serveur : celles que tout administrateur avait alors. */
export const PERMISSIONS_ANCIENNE_SESSION: readonly PermissionAdmin[] = ['CONSULTER_TABLEAU_DE_BORD', 'GERER_COMPTES', 'CONSULTER_JOURNAL'];

/** Responsabilités qu’un super administrateur attribue, dans l’ordre d’affichage. */
export type Responsabilite = Exclude<PermissionAdmin, 'CONSULTER_TABLEAU_DE_BORD' | 'GERER_ADMINISTRATEURS'>;
export const RESPONSABILITES: readonly { valeur: Responsabilite; libelle: string; description: string }[] = [
  { valeur: 'GERER_COMPTES', libelle: 'Comptes', description: 'Inscriptions, création et import de comptes, diplômés, suspensions.' },
  { valeur: 'GERER_STAGES', libelle: 'Stages', description: 'Offres, listes définitives, conventions et suivi des stages.' },
  { valeur: 'GERER_MOBILITES', libelle: 'Mobilités', description: 'Demandes et conventions de mobilité.' },
  { valeur: 'GERER_PARTENARIATS', libelle: 'Partenariats', description: 'Organismes partenaires et conventions cadres.' },
  { valeur: 'GERER_EVENEMENTS', libelle: 'Événements', description: 'Événements officiels et gestion des événements des membres.' },
  { valeur: 'GERER_MENTORAT', libelle: 'Mentorat', description: 'Programmes de mentorat.' },
  { valeur: 'GERER_COMMUNAUTES', libelle: 'Communautés', description: 'Communautés de la messagerie : création, accès et modification.' },
  { valeur: 'GERER_OFFRES_EMPLOI', libelle: 'Offres d’emploi', description: 'Toutes les offres d’emploi, vérification, retrait et signalements.' },
  { valeur: 'CONSULTER_JOURNAL', libelle: 'Journal', description: 'Lecture du journal des décisions.' },
];
export const LIBELLES_PERMISSION: Record<PermissionAdmin, string> = {
  CONSULTER_TABLEAU_DE_BORD: 'Tableau de bord',
  GERER_ADMINISTRATEURS: 'Super administrateur',
  ...Object.fromEntries(RESPONSABILITES.map((r) => [r.valeur, r.libelle])) as Record<Responsabilite, string>,
};

export interface FicheCompte {
  compte: CompteAdmin;
  villeResidence: string | null;
  posteActuel: string | null;
  lienLinkedin: string | null;
  lienPortfolio: string | null;
  bio: string | null;
  diplome: string | null;
  dateNaissance: string | null;
  doitChangerMotDePasse: boolean;
  nombreFormations: number;
  nombreExperiences: number;
  /** Responsabilités enregistrées d’un compte d’administration (vide pour un membre). */
  responsabilites: PermissionAdmin[];
}

export interface EntreeJournal {
  id: string;
  type: TypeActionAdmin;
  motif: string | null;
  details: string | null;
  dateAction: string;
  auteur: string;
  cibleId: string;
  cibleNom: string;
  cibleRole: RoleCompte;
}

export interface TableauDeBordAdmin {
  /** superAdministrateursActifs : à 1, plus personne ne peut gérer les administrateurs si ce compte perd son accès. */
  /** offresEmploiAModerer : offres d’emploi en attente de vérification, ou publiées et signalées (#224). */
  aTraiter: {
    inscriptionsEnAttente: number; plusAncienneInscription: string | null; superAdministrateursActifs: number; offresEmploiAModerer: number;
  };
  communaute: {
    comptesActifs: number;
    inscritsCeMois: number;
    mentoratsEnCours: number;
    programmesOuverts: number;
    evenementsAVenir: number;
  };
  dernieresDecisions: EntreeJournal[];
}

export const LIBELLES_DIPLOME: Record<string, string> = {
  INGENIEUR: 'Ingénieur', LICENCE: 'Licence', MASTER: 'Master', MASTERE: 'Mastère', DOCTORAT: 'Doctorat',
};

export const LIBELLES_STATUT_COMPTE: Record<StatutCompte, string> = {
  EN_ATTENTE: 'En attente',
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
};

export const LIBELLES_ROLE_COMPTE: Record<RoleCompte, string> = {
  ETUDIANT: 'Étudiant',
  ALUMNI: 'Alumni',
  PERSONNEL: 'Personnel EPT',
  ORGANISME: 'Organisme',
  ADMIN: 'Administrateur',
  VISITEUR: 'Visiteur',
};

export const LIBELLES_ACTION_ADMIN: Record<TypeActionAdmin, string> = {
  VALIDATION_INSCRIPTION: 'Inscription validée',
  REFUS_INSCRIPTION: 'Inscription refusée',
  SUSPENSION: 'Compte suspendu',
  REACTIVATION: 'Compte réactivé',
  CREATION_COMPTE: 'Compte créé',
  CHANGEMENT_ROLE: 'Rôle changé',
  DIPLOMATION: 'Diplôme enregistré',
  MODIFICATION_IDENTITE: 'Nom corrigé',
  MODIFICATION_RESPONSABILITES: 'Responsabilités modifiées',
  DESIGNATION_CHEF_DEPARTEMENT: 'Désigné chef de département',
  RETRAIT_CHEF_DEPARTEMENT: 'N’est plus chef de département',
  MODIFICATION_CLASSE: 'Classe modifiée',
  PUBLICATION_OFFRE_EMPLOI: 'Offre d’emploi publiée',
  REFUS_OFFRE_EMPLOI: 'Offre d’emploi refusée',
  RETRAIT_OFFRE_EMPLOI: 'Offre d’emploi retirée',
  CLASSEMENT_SIGNALEMENTS_OFFRE_EMPLOI: 'Signalements d’offre classés',
};

/** Détails lisibles : rôles et responsabilités techniques (« ALUMNI → ADMIN », « GERER_STAGES ») deviennent leurs libellés. */
export function detailsLisibles(details: string | null): string | null {
  if (!details) return null;
  return details.replace(/[A-Z_]{4,}/g, (code) =>
    LIBELLES_ROLE_COMPTE[code as RoleCompte] ?? LIBELLES_PERMISSION[code as PermissionAdmin] ?? code);
}
