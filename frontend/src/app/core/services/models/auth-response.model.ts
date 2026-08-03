export interface AuthResponse {
  token: string;
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  statutCompte: 'EN_ATTENTE' | 'ACTIF' | 'SUSPENDU';
  message?: string
}
