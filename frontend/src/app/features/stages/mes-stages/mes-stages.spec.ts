import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MonStage } from '../../../core/services/models/stage.model';
import { MesStages } from './mes-stages';

describe('MesStages', () => {
  let http: HttpTestingController;

  const afficher = (reponse: MonStage[] | 'erreur') => {
    TestBed.configureTestingModule({ imports: [MesStages], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MesStages);
    fixture.detectChanges();
    const requete = http.expectOne('/api/stages/mes-stages');
    if (reponse === 'erreur') requete.flush(null, { status: 500, statusText: 'Erreur' });
    else requete.flush(reponse);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => http.verify());

  it('montre chaque stage confirmé avec son organisme et ses dates', () => {
    const racine = afficher([{
      id: 's1', offreId: 'o1', sujet: 'Développeur web', organisme: 'Kër Data', typeStage: 'PFE', lieu: 'Dakar',
      dateDebut: '2027-02-01', dateFin: '2027-05-31', confirmeLe: '2026-12-20T10:00:00Z',
    }]);
    expect(racine.querySelector('.stage a')?.getAttribute('href')).toBe('/stages/offres/o1');
    expect(racine.querySelector('.organisme')?.textContent).toContain('Kër Data · Dakar');
    expect(racine.querySelector('.periode')?.textContent).toMatch(/Du 1 \S+ 2027 au 31 \S+ 2027/);
    expect(racine.querySelector('.type')?.textContent).toBe('Projet de fin d’études');
  });

  it('explique quand un stage apparaîtra, et signale une erreur', () => {
    expect(afficher([]).querySelector('.etat h2')?.textContent).toContain('Aucun stage confirmé');
    TestBed.resetTestingModule();
    expect(afficher('erreur').querySelector('[role="alert"]')).not.toBeNull();
  });
});
