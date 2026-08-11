import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { AuthResponse } from '../models/auth-response.model';
import { tap } from 'rxjs';
import { InscriptionResponse } from '../models/InscriptionResponse';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh';
  private readonly USER_KEY = 'auth_user';

  private readonly utilisateurSignal = signal<AuthResponse | null>(this.lireUtilsateur());

  readonly utilisateur = this.utilisateurSignal.asReadonly();
  readonly estConnecte = computed(() => this.utilisateurSignal() !== null);

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap((response) => this.stocker(response)));
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

  private lireUtilsateur(): AuthResponse | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? (JSON.parse(userJson) as AuthResponse) : null;
  }
}
