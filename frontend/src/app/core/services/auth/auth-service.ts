import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { AuthResponse } from '../models/auth-response.model';
import { tap } from 'rxjs';
import { InscriptionResponse } from '../models/InscriptionResponse';
import { LiaisonGoogle } from '../models/liaison-google.model';
import { Profil } from '../models/profil.model';
import { PERMISSIONS_ANCIENNE_SESSION, PermissionAdmin } from '../models/admin.model';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh';
  private readonly USER_KEY = 'auth_user';

  private readonly utilisateurSignal = signal<AuthResponse | null>(this.lireUtilsateur());

  readonly utilisateur = this.utilisateurSignal.asReadonly();
  readonly estConnecte = computed(() => this.utilisateurSignal() !== null);

  /** Vrai si le compte a cette permission d’administration (voir PermissionAdmin côté serveur). */
  aPermission(permission: PermissionAdmin): boolean {
    const utilisateur = this.utilisateurSignal();
    // Une session ouverte avant l’ajout des permissions ne les porte pas : on lui prête celles qu’avait alors tout
    // administrateur, le temps que resynchroniser() relise les vraies.
    const permissions = utilisateur?.permissions ?? (utilisateur?.role === 'ADMIN' ? PERMISSIONS_ANCIENNE_SESSION : []);
    return permissions.includes(permission);
  }

  /**
   * Relit le compte auprès du serveur : statut (validé, suspendu), rôle et permissions ont pu changer
   * depuis la connexion, alors que la session stockée date de ce moment-là.
   */
  resynchroniser(): void {
    if (!this.utilisateurSignal()) return;
    this.http.get<AuthResponse>('/api/auth/me').subscribe({
      next: (moi) => {
        const courant = this.utilisateurSignal();
        if (!courant) return;
        const actualise: AuthResponse = {
          ...courant,
          nom: moi.nom, prenom: moi.prenom, role: moi.role, statutCompte: moi.statutCompte,
          doitChangerMotDePasse: moi.doitChangerMotDePasse, urlPhoto: moi.urlPhoto, permissions: moi.permissions,
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(actualise));
        this.utilisateurSignal.set(actualise);
      },
      error: () => {},
    });
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap((response) => this.stocker(response)));
  }

  /** Inscription avec Google : l'adresse vient du jeton, le serveur ouvre directement la session. */
  inscriptionGoogle(donnees: Record<string, unknown>) {
    return this.http
      .post<AuthResponse>('/api/auth/google/inscription', donnees)
      .pipe(tap((response) => this.stocker(response)));
  }

  /** Connexion avec le jeton d'identité renvoyé par le bouton Google (404 « COMPTE_INCONNU » sans compte). */
  connexionGoogle(credential: string) {
    return this.http
      .post<AuthResponse>('/api/auth/google', { credential })
      .pipe(tap((response) => this.stocker(response)));
  }

  /** Compte Google lié au compte connecté (paramètres). */
  liaisonGoogle() {
    return this.http.get<LiaisonGoogle>('/api/auth/google/liaison');
  }

  /** Lie le compte Google choisi ; 409 « ADRESSE_DEJA_LIEE » s'il est déjà lié à un autre compte. */
  lierGoogle(credential: string) {
    return this.http.post<LiaisonGoogle>('/api/auth/google/liaison', { credential });
  }

  /** Délie Google ; 409 « MOT_DE_PASSE_REQUIS » sans mot de passe connu. */
  delierGoogle() {
    return this.http.delete<LiaisonGoogle>('/api/auth/google/liaison');
  }

  /** Identifiant client du bouton Google ; `null` quand la connexion Google n'est pas configurée. */
  configurationGoogle() {
    return this.http.get<{ clientId: string | null }>('/api/auth/google/configuration');
  }

  demanderReinitialisation(email: string) {
    return this.http.post<{ message: string }>('/api/auth/mot-de-passe-oublie', { email });
  }

  reinitialiserMotDePasse(email: string, code: string, nouveauMotDePasse: string) {
    return this.http.post<{ message: string }>('/api/auth/reinitialiser-mot-de-passe', {
      email,
      code,
      nouveauMotDePasse
    });
  }

  logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post('/api/auth/logout', { refreshToken }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.utilisateurSignal.set(null);
  }

  inscrire(donnees: Record<string, unknown>) {
    return this.http.post<InscriptionResponse>('/api/auth/register', donnees);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  majAccessToken(nouveauToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, nouveauToken);
  }

  public stocker(response: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
    this.utilisateurSignal.set(response);
  }

  rafraichir() {
    const refresh = this.getRefreshToken();
    return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken: refresh });
  }

  /** Prénom et nom ne sont pris en compte que pour un compte d’administration, qui n’a pas de profil de membre. */
  changerMotDePasseInitial(nouveauMotDePasse: string, identite?: { prenom: string; nom: string }) {
    return this.http.post<AuthResponse>('/api/auth/changer-mot-de-passe-initial', {
      nouveauMotDePasse,
      refreshToken: this.getRefreshToken() ?? '',
      ...identite
    }).pipe(tap((response) => this.stocker(response)));
  }

  changerMotDePasse(motDePasseActuel: string, nouveauMotDePasse: string) {
    return this.http.post<AuthResponse>('/api/auth/changer-mot-de-passe', {
      motDePasseActuel,
      nouveauMotDePasse
    }).pipe(tap((response) => this.stocker(response)));
  }

  synchroniserProfil(profil: Pick<Profil, 'nom' | 'prenom' | 'urlPhoto'>): void {
    const courant = this.utilisateurSignal();
    if (!courant) return;
    const actualise = {
      ...courant,
      nom: profil.nom,
      prenom: profil.prenom,
      urlPhoto: profil.urlPhoto
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(actualise));
    this.utilisateurSignal.set(actualise);
  }

  private lireUtilsateur(): AuthResponse | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? (JSON.parse(userJson) as AuthResponse) : null;
  }
}
