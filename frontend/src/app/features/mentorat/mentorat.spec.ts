import { EnvironmentInjector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../core/services/mentorat/compteur-demandes';
import { MentoratPage } from './mentorat';
import { MENTORAT_ROUTES } from './mentorat.routes';

describe('MentoratPage', () => {
  const utilisateur = signal<{ role: string } | null>(null);
  const nombre = signal(0);
  const actualiser = vi.fn();

  beforeEach(() => {
    actualiser.mockClear();
    nombre.set(0);
    TestBed.configureTestingModule({
      imports: [MentoratPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { utilisateur } },
        { provide: CompteurDemandesMentorat, useValue: { nombre, actualiser } },
      ],
    });
  });

  function afficher(role: string): HTMLElement {
    utilisateur.set({ role });
    const fixture = TestBed.createComponent(MentoratPage);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const onglets = (racine: HTMLElement) =>
    [...racine.querySelectorAll('.onglets a')].map((lien) => lien.textContent?.trim());

  it('propose à l’étudiant de chercher un mentor et de suivre ses demandes', () => {
    const racine = afficher('ETUDIANT');
    expect(onglets(racine)).toEqual(['Trouver un mentor', 'Mes demandes', 'Mes mentorats']);
    expect(actualiser).not.toHaveBeenCalled();
  });

  it('propose à l’alumni ses demandes reçues avec leur nombre', () => {
    nombre.set(3);
    const racine = afficher('ALUMNI');
    expect(actualiser).toHaveBeenCalledOnce();
    expect(onglets(racine)[0]).toContain('Demandes reçues');
    expect(racine.querySelector('.compteur')?.textContent).toContain('3 en attente');
    expect(racine.querySelectorAll('.onglets a')).toHaveLength(3);
  });

  it.each(['PERSONNEL', 'VISITEUR', 'ORGANISME', 'ADMIN'])('présente le module aux autres rôles (%s)', (role) => {
    const racine = afficher(role);
    expect(racine.querySelector('.onglets')).toBeNull();
    expect(racine.textContent).toContain('Le mentorat relie étudiants et alumni');
  });

  it.each([
    ['ETUDIANT', 'trouver'],
    ['ALUMNI', 'recues'],
    ['VISITEUR', 'presentation'],
  ])('ouvre l’onglet adapté au rôle %s', (role, onglet) => {
    utilisateur.set({ role });
    const cadre = MENTORAT_ROUTES.find((route) => route.path === '') as Route;
    const redirection = cadre.children?.find((route) => route.path === '')?.redirectTo;
    const cible = runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
      typeof redirection === 'function' ? redirection({} as never) : redirection);
    expect(cible).toBe(onglet);
  });

  it('réserve les onglets à leur rôle', () => {
    const cadre = MENTORAT_ROUTES.find((route) => route.path === '') as Route;
    const roles = Object.fromEntries((cadre.children ?? [])
      .filter((route) => route.data?.['roles'])
      .map((route) => [route.path, route.data?.['roles']]));
    expect(roles).toEqual({
      trouver: ['ETUDIANT'], demandes: ['ETUDIANT'], suivis: ['ETUDIANT'],
      recues: ['ALUMNI'], mentores: ['ALUMNI'], offre: ['ALUMNI'],
    });
  });
});
