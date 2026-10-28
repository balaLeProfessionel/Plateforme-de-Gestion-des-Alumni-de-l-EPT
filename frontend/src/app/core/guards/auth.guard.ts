import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth/auth-service";
import { PermissionAdmin } from "../services/models/admin.model";

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

/** Exige la permission d’administration déclarée dans `data.permission`. */
export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.utilisateur()) {
    return router.createUrlTree(['/connexion']);
  }
  const permission = route.data['permission'] as PermissionAdmin | undefined;
  // Pas vers /accueil : l’accueil renvoie l’administration ici, ce qui bouclerait.
  return !permission || authService.aPermission(permission) ? true : router.createUrlTree(['/annuaire']);
};

/** L’accueil de l’administration est son tableau de bord. */
export const accueilAdministrationGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.aPermission('CONSULTER_TABLEAU_DE_BORD') ? inject(Router).createUrlTree(['/admin']) : true;
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
