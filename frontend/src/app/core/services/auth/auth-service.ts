import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { AuthResponse } from '../models/auth-response.model';
import { tap } from 'rxjs';
import { InscriptionResponse } from '../models/InscriptionResponse';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly TOKEN_KEY = 'auth_token';
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
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.utilisateurSignal.set(null);
  }

  inscrire(donnees: Record<string, unknown>) {
    return this.http.post<InscriptionResponse>('/api/auth/register', donnees);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private stocker(response: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
    this.utilisateurSignal.set(response);
  }

  private lireUtilsateur(): AuthResponse | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? (JSON.parse(userJson) as AuthResponse) : null;
  }
}
