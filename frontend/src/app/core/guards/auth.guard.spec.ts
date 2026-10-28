import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import {
  accueilAdministrationGuard,
  authGuard,
  permissionGuard,
  changementInitialRequisGuard,
  changementInitialSeulementGuard,
  roleGuard
} from './auth.guard';
import { AuthService } from '../services/auth/auth-service';

describe('gardes d authentification', () => {
  let utilisateur: Record<string, unknown> | null;

  beforeEach(() => {
    utilisateur = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            estConnecte: () => utilisateur !== null,
            utilisateur: () => utilisateur,
            aPermission: (permission: string) => ((utilisateur?.['permissions'] as string[] | undefined) ?? []).includes(permission)
          }
        }
      ]
    });
  });

  function executer(garde: (...args: never[]) => unknown, route: object = {}): unknown {
    return TestBed.runInInjectionContext(() => garde(route as never, {} as never));
  }

  it('exige la permission de la rubrique d administration', () => {
    utilisateur = { role: 'ADMIN', permissions: ['GERER_COMPTES'] };
    expect(executer(permissionGuard, { data: { permission: 'GERER_COMPTES' } })).toBe(true);
    const refus = executer(permissionGuard, { data: { permission: 'CONSULTER_JOURNAL' } }) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(refus)).toBe('/annuaire');
  });

  it('ouvre le tableau de bord a la place de l accueil pour l administration', () => {
    utilisateur = { role: 'ADMIN', permissions: ['CONSULTER_TABLEAU_DE_BORD'] };
    expect(TestBed.inject(Router).serializeUrl(executer(accueilAdministrationGuard) as UrlTree)).toBe('/admin');
    utilisateur = { role: 'ALUMNI', permissions: [] };
    expect(executer(accueilAdministrationGuard)).toBe(true);
  });

  it('redirige un visiteur non connecte vers la connexion', () => {
    const resultat = executer(authGuard) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultat)).toBe('/connexion');
  });

  it('redirige la session initiale vers le changement obligatoire', () => {
    utilisateur = { role: 'ETUDIANT', doitChangerMotDePasse: true };
    const resultat = executer(changementInitialRequisGuard) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultat)).toBe('/premiere-connexion');
  });

  it('interdit l ecran initial une fois le changement termine', () => {
    utilisateur = { role: 'ETUDIANT', doitChangerMotDePasse: false };
    const resultat = executer(changementInitialSeulementGuard) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultat)).toBe('/accueil');
  });

  it('refuse une route reservee a un autre role', () => {
    utilisateur = { role: 'VISITEUR', doitChangerMotDePasse: false };
    const resultat = executer(roleGuard, { data: { roles: ['ADMIN'] } }) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultat)).toBe('/accueil');
  });
});
