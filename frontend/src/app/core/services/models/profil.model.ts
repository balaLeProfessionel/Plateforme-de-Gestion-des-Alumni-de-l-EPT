// Miroirs TypeScript des DTO du backend (package parcours et utilisateur).
// Les enums sont typees en unions litterales : le compilateur refuse alors
// toute valeur hors liste, y compris dans les <option> des <select>.

export type TypeFormation = 'DIPLOMANTE' | 'CERTIFICATION' | 'SEMINAIRE' | 'AUTRE';

export type TypeContrat = 'CDI' | 'CDD' | 'STAGE' | 'FREELANCE' | 'FONCTION_PUBLIQUE';

// ===== Infos personnelles : GET / PATCH /api/profil/me =====

export interface Profil {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  statutCompte: string;
  bio: string | null;
  villeResidence: string | null;
  posteActuel: string | null;
  lienLinkedin: string | null;
  lienPortfolio: string | null;
  urlPhoto: string | null;
  telephone: string | null;
  dateNaissance: string | null; // format ISO yyyy-MM-dd
  filiere: string | null;
  anneeSortie: number | null;
}

// Le backend fait une mise a jour partielle : tous les champs sont optionnels.
export interface ProfilRequest {
  bio?: string;
  villeResidence?: string;
  posteActuel?: string;
  lienLinkedin?: string;
  lienPortfolio?: string;
  urlPhoto?: string;
  telephone?: string;
  dateNaissance?: string;
  effacerDateNaissance?: boolean;
}

// ===== Lien vers un organisme, partage par les experiences et les formations =====
// L'utilisateur choisit un organisme existant (organismeId) OU saisit un nom
// libre (nomNouvelOrganisme) que le backend cree ou reutilise.
export interface LienOrganisme {
  organismeId?: string;
  nomNouvelOrganisme?: string;
}

// ===== Experiences professionnelles : /api/experiences =====

export interface Experience {
  id: string;
  poste: string;
  typeContrat: TypeContrat;
  dateDebut: string;
  dateFin: string | null;
  estStage: boolean;
  enCours: boolean;
  organismeId: string;
  nomOrganisme: string;
}

export interface ExperienceRequest extends LienOrganisme {
  poste: string;
  typeContrat: TypeContrat;
  dateDebut: string;
  dateFin?: string | null;
  estStage: boolean;
}

// ===== Formations : /api/formations =====

export interface Formation {
  id: string;
  libelle: string;
  description: string | null;
  typeFormation: TypeFormation;
  dateDebut: string;
  dateFin: string | null;
  estStage: boolean;
  enCours: boolean;
  organismeId: string;
  nomOrganisme: string;
}

export interface FormationRequest extends LienOrganisme {
  libelle: string;
  description?: string | null;
  typeFormation: TypeFormation;
  dateDebut: string;
  dateFin?: string | null;
  estStage: boolean;
}
