import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth/auth-service";

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estConnecte()) {
    return true;
  }

  return router.createUrlTree(['/connexion']);
}

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const utilisateur = authService.utilisateur();
  const roles = route.data['roles'] as string[] | undefined;

  if (!utilisateur) {
    return router.createUrlTree(['/connexion']);
  }

  return !roles || roles.includes(utilisateur.role)
    ? true
    : router.createUrlTree(['/accueil']);
};

export const changementInitialRequisGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.utilisateur()?.doitChangerMotDePasse
    ? router.createUrlTree(['/premiere-connexion'])
    : true;
};

export const changementInitialSeulementGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const utilisateur = authService.utilisateur();

  if (!utilisateur) {
    return router.createUrlTree(['/connexion']);
  }
  return utilisateur.doitChangerMotDePasse
    ? true
    : router.createUrlTree(['/accueil']);
};
