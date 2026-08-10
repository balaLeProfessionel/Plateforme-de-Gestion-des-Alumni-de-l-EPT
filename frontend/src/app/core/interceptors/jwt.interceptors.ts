import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { AuthService } from "../services/auth/auth-service";
import { inject } from "@angular/core/primitives/di";
import { BehaviorSubject, catchError, filter, switchMap, switchMap, take, throwError } from "rxjs";
import { Router } from "@angular/router";

// État partagé entre les appels de l'intercepteur pour éviter les rafraîchissements multiples
let rafraichissementEnCours = false;
const nouveauTokenSujet = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // On n'ajoute pas de token aux appels d'authentification eux-mêmes
  const estAppelAuth =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/register') ||
    req.url.includes('/api/auth/refresh') ||
    req.url.includes('/api/auth/verifier-otp') ||
    req.url.includes('/api/auth/renvoyer-otp');

  const token = inject(AuthService).getToken();
  const requeteAvecToken =
    token && !estAppelAuth
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;
  return next(requeteAvecToken).pipe(
    catchError((erreur: HttpErrorResponse) => {
      // Si ce n'est pas un 401, ou si c'est un appel d'auth, on ne tente pas de rafraîchir
      if (erreur.status !== 401 || estAppelAuth) {
        return throwError(() => erreur);
      }

      // 401 sur une requête normale : le token a probablement expiré
      if (!rafraichissementEnCours) {
        rafraichissementEnCours = true;
        nouveauTokenSujet.next(null);

        return authService.rafraichir().pipe(
          switchMap((reponse) => {
            rafraichissementEnCours = false;
            authService.majAccessToken(reponse.token);
            nouveauTokenSujet.next(reponse.token);
            // On rejoue la requête initiale avec le nouveau token
            return next(
              req.clone({ setHeaders: { Authorization: `Bearer ${reponse.token}` } })
            );
          }),
          catchError((erreurRefresh) => {
            // Le rafraîchissement a échoué : session vraiment expirée, on déconnecte
            rafraichissementEnCours = false;
            authService.logout();
            router.navigate(['/connexion']);
            return throwError(() => erreurRefresh);
          })
        );
      } else {
        // Un rafraîchissement est déjà en cours : on attend son résultat,
        // puis on rejoue la requête avec le nouveau token
        return nouveauTokenSujet.pipe(
          filter((t) => t !== null),
          take(1),
          switchMap((nouveauToken) =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${nouveauToken}` } }))
          )
        );
      }
    })
  );
};
