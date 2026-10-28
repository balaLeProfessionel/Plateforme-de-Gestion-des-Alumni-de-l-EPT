import { EnvironmentInjector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../core/services/mentorat/compteur-demandes';
import { ROLES_MENTORAT } from '../../core/services/models/mentorat.model';
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

  const groupes = (racine: HTMLElement) => [...racine.querySelectorAll('.onglets [role="group"]')].map((groupe) => ({
    titre: groupe.querySelector('.titre-groupe')?.textContent?.trim(),
    onglets: [...groupe.querySelectorAll('a')].map((lien) => lien.textContent?.trim()),
  }));

  it.each(['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'VISITEUR'])('donne les deux casquettes à tout membre (%s)', (role) => {
    nombre.set(3);
    const racine = afficher(role);
    expect(groupes(racine)).toEqual([
      { titre: 'Être accompagné', onglets: ['Trouver un mentor', 'Mes mentorats'] },
      { titre: 'Accompagner', onglets: ['Mes mentorés 3 en attente', 'Mon offre'] },
    ]);
    expect(actualiser).toHaveBeenCalledOnce();
    expect((racine.querySelector('app-guide-mentorat details') as HTMLDetailsElement).open).toBe(false);
  });

  it.each([
    ['ADMIN', true], ['PERSONNEL', false], ['ETUDIANT', false], ['ALUMNI', false], ['VISITEUR', false],
  ])('propose « Gérer les programmes » à l’administration seule (%s)', (role, visible) => {
    const lien = afficher(role).querySelector('.lien-gestion');
    expect(lien !== null).toBe(visible);
    if (lien) expect(lien.getAttribute('href')).toBe('/mentorat/gestion-programmes');
  });

  it('réserve la gestion des programmes et leur tableau de bord à l’administration', () => {
    const gestion = MENTORAT_ROUTES.filter((route) => route.path?.startsWith('gestion-programmes'));
    expect(gestion.map((route) => route.path)).toEqual(
      ['gestion-programmes', 'gestion-programmes/nouveau', 'gestion-programmes/:id/tableau', 'gestion-programmes/:id']);
    for (const route of gestion) expect(route.data?.['roles']).toEqual(['ADMIN']);
  });

  it.each(['ORGANISME', 'ADMIN'])('présente le module aux comptes qui n’y participent pas (%s)', (role) => {
    const racine = afficher(role);
    expect(racine.querySelector('.onglets')).toBeNull();
    expect(racine.textContent).toContain('Le mentorat relie les membres de l’EPT');
    expect((racine.querySelector('app-guide-mentorat details') as HTMLDetailsElement).open).toBe(true);
    expect(actualiser).not.toHaveBeenCalled();
  });

  it.each([
    ['ETUDIANT', 'trouver'],
    ['ALUMNI', 'mentores'],
    ['PERSONNEL', 'trouver'],
    ['VISITEUR', 'trouver'],
    ['ORGANISME', 'presentation'],
  ])('ouvre l’onglet adapté au rôle %s', (role, onglet) => {
    utilisateur.set({ role });
    const cadre = MENTORAT_ROUTES.find((route) => route.path === '') as Route;
    const redirection = cadre.children?.find((route) => route.path === '')?.redirectTo;
    const cible = runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
      typeof redirection === 'function' ? redirection({} as never) : redirection);
    expect(cible).toBe(onglet);
  });

  it('ouvre chaque onglet à tous les membres participants', () => {
    const cadre = MENTORAT_ROUTES.find((route) => route.path === '') as Route;
    const roles = Object.fromEntries((cadre.children ?? [])
      .filter((route) => route.data?.['roles'])
      .map((route) => [route.path, route.data?.['roles']]));
    expect(roles).toEqual({
      trouver: ROLES_MENTORAT, mentorats: ROLES_MENTORAT, mentores: ROLES_MENTORAT, offre: ROLES_MENTORAT,
    });
  });

  it('regroupe les anciennes rubriques dans les deux pages et garde leurs adresses', () => {
    const cadre = MENTORAT_ROUTES.find((route) => route.path === '') as Route;
    const redirections = Object.fromEntries((cadre.children ?? [])
      .filter((route) => typeof route.redirectTo === 'string')
      .map((route) => [route.path, route.redirectTo]));
    expect(redirections).toEqual({ demandes: 'mentorats', suivis: 'mentorats', recues: 'mentores' });
    const sections = (chemin: string) => (cadre.children ?? []).find((route) => route.path === chemin)
      ?.data?.['sections'].map((section: { titre: string }) => section.titre);
    expect(sections('mentorats')).toEqual(['Demandes en attente', 'En cours', 'Historique']);
    expect(sections('mentores')).toEqual(['À traiter', 'En cours', 'Historique']);
  });
});
