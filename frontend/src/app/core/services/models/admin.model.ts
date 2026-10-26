export type StatutCompte = 'EN_ATTENTE' | 'ACTIF' | 'SUSPENDU';
export type RoleCompte = 'ETUDIANT' | 'ALUMNI' | 'PERSONNEL' | 'ORGANISME' | 'ADMIN' | 'VISITEUR';
export type TypeActionAdmin = 'VALIDATION_INSCRIPTION' | 'REFUS_INSCRIPTION' | 'SUSPENSION' | 'REACTIVATION'
  | 'CREATION_COMPTE' | 'CHANGEMENT_ROLE' | 'DIPLOMATION';

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
}

export interface ResultatImport {
  crees: number;
  lignes: { numero: number; email: string; creee: boolean; message: string | null; id: string | null; motDePasseTemporaire: string | null }[];
}

export interface ResultatDiplomation {
  diplomes: number;
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

/** Miroir de PermissionAdmin : chaque rubrique de l’administration exige l’une d’elles. */
export type PermissionAdmin = 'CONSULTER_TABLEAU_DE_BORD' | 'GERER_COMPTES' | 'CONSULTER_JOURNAL';
export const TOUTES_LES_PERMISSIONS: readonly PermissionAdmin[] = ['CONSULTER_TABLEAU_DE_BORD', 'GERER_COMPTES', 'CONSULTER_JOURNAL'];

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
  aTraiter: { inscriptionsEnAttente: number; plusAncienneInscription: string | null };
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
  ADMIN: 'Administration',
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
};

/** Détails lisibles : les rôles techniques (« ALUMNI → ADMIN ») deviennent leurs libellés. */
export function detailsLisibles(details: string | null): string | null {
  if (!details) return null;
  return details.replace(/[A-Z_]{4,}/g, (role) => LIBELLES_ROLE_COMPTE[role as RoleCompte] ?? role);
}
