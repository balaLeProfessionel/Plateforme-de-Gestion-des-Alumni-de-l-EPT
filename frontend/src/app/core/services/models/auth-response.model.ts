export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  statutCompte: 'EN_ATTENTE' | 'ACTIF' | 'SUSPENDU';
  doitChangerMotDePasse: boolean;
  message?: string
}
