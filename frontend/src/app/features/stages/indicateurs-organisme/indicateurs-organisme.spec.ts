import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { IndicateursOrganisme } from '../../../core/services/models/stage.model';
import { IndicateursOrganismePage } from './indicateurs-organisme';

describe('IndicateursOrganismePage', () => {
  let http: HttpTestingController;

  const afficher = async (reponse: IndicateursOrganisme) => {
    TestBed.configureTestingModule({ imports: [IndicateursOrganismePage], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(IndicateursOrganismePage);
    fixture.detectChanges();
    http.expectOne('/api/stages/mes-indicateurs').flush(reponse);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => http.verify());

  it('montre les totaux, les années et les répartitions', async () => {
    const racine = await afficher({
      offresPubliees: 3, candidaturesRecues: 12, etudiantsAccueillis: 4,
      parAnnee: [{ annee: 2026, offres: 2, candidatures: 9 }, { annee: 2025, offres: 1, candidatures: 3 }],
      accueillisParType: [{ cle: 'PFE', nombre: 3 }, { cle: 'OUVRIER', nombre: 1 }],
      accueillisParFiliere: [{ cle: 'Génie Civil', nombre: 4 }],
    });
    expect([...racine.querySelectorAll('.chiffres dd')].map((d) => d.textContent)).toEqual(['3', '12', '4']);
    expect(racine.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(racine.querySelector('.barres .libelle')?.textContent).toBe('Projet de fin d’études');
    expect(racine.textContent).toContain('Ouvrier');
  });

  it('annonce l’absence d’indicateur avant la première offre', async () => {
    const racine = await afficher({ offresPubliees: 0, candidaturesRecues: 0, etudiantsAccueillis: 0, parAnnee: [], accueillisParType: [], accueillisParFiliere: [] });
    expect(racine.textContent).toContain('Pas encore d’indicateur');
    expect(racine.querySelector('table')).toBeNull();
  });
});
