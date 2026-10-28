import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AUCUN_FILTRE, FiltresEvenements, PeriodeEvenement } from '../../../core/services/models/evenement';
import { BarreFiltresEvenements } from './filtres-evenements';

describe('BarreFiltresEvenements', () => {
  let fixture: ComponentFixture<BarreFiltresEvenements>;
  let emis: FiltresEvenements[];
  let periodes: PeriodeEvenement[];
  let effacements: number;

  function afficher(filtres: FiltresEvenements = AUCUN_FILTRE, periode: PeriodeEvenement = 'AVENIR'): HTMLElement {
    fixture = TestBed.createComponent(BarreFiltresEvenements);
    fixture.componentRef.setInput('filtres', filtres);
    fixture.componentRef.setInput('periode', periode);
    emis = [];
    periodes = [];
    effacements = 0;
    fixture.componentInstance.effaces.subscribe(() => effacements++);
    fixture.componentInstance.modifies.subscribe((valeur) => emis.push(valeur));
    fixture.componentInstance.periodeChoisie.subscribe((valeur) => periodes.push(valeur));
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const ouvrir = (racine: HTMLElement) => {
    (racine.querySelector('.bouton-filtres') as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  afterEach(() => vi.useRealTimers());

  it('ne montre que la recherche ; les autres critères sont repliés derrière « Filtres »', () => {
    const racine = afficher();
    const bouton = racine.querySelector('.bouton-filtres') as HTMLButtonElement;
    expect(racine.querySelector('#filtre-recherche')).not.toBeNull();
    expect(racine.querySelector('#panneau-filtres')).toBeNull();
    expect(bouton.getAttribute('aria-expanded')).toBe('false');
    expect(racine.querySelector('input[type="date"]')).toBeNull();

    ouvrir(racine);
    expect(bouton.getAttribute('aria-expanded')).toBe('true');
    expect([...racine.querySelectorAll('#panneau-filtres [role="group"]')].map((g) => g.getAttribute('aria-label')))
      .toEqual(['Période', 'Organisé par']);
    expect(racine.querySelector('#filtre-lieu')).not.toBeNull();
  });

  it('applique la recherche après une courte pause de saisie, sans bouton', async () => {
    vi.useFakeTimers();
    const racine = afficher();
    const champ = racine.querySelector('#filtre-recherche') as HTMLInputElement;
    champ.value = '  forum ';
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(emis).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(300);
    expect(emis).toEqual([{ ...AUCUN_FILTRE, recherche: 'forum' }]);
    expect(racine.querySelector('button[type="submit"]')).toBeNull();
  });

  it('applique tout de suite la période et l’organisation', () => {
    const racine = afficher();
    ouvrir(racine);
    const [passes] = [...racine.querySelectorAll('[aria-label="Période"] button')].slice(1) as HTMLButtonElement[];
    passes.click();
    (racine.querySelectorAll('[aria-label="Organisé par"] button')[1] as HTMLButtonElement).click();

    expect(periodes).toEqual(['PASSES']);
    expect(emis).toEqual([{ ...AUCUN_FILTRE, officiel: 'oui' }]);
  });

  it('compte les critères repliés en vigueur et efface tout', () => {
    const racine = afficher({ recherche: 'forum', lieu: 'Thiès', officiel: 'non' }, 'PASSES');
    expect(racine.querySelector('.pastille')?.textContent).toContain('3');
    ouvrir(racine);
    expect(racine.querySelector('[aria-label="Organisé par"] button[aria-pressed="true"]')?.textContent).toContain('Communauté');

    (racine.querySelector('.effacer') as HTMLButtonElement).click();
    // Un seul signal : la page remet tout à zéro en une navigation (deux se marcheraient dessus).
    expect(effacements).toBe(1);
    expect(emis).toEqual([]);
    expect(periodes).toEqual([]);
  });

  it('n’affiche ni compteur ni « Effacer » sans critère', () => {
    const racine = afficher();
    ouvrir(racine);
    expect(racine.querySelector('.pastille')).toBeNull();
    expect(racine.querySelector('.effacer')).toBeNull();
  });
});
