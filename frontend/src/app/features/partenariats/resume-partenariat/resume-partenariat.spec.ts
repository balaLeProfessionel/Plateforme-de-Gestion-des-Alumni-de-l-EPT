import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MonPartenariat } from '../../../core/services/models/partenariat.model';
import { ResumePartenariat } from './resume-partenariat';

describe('ResumePartenariat', () => {
  const afficher = (resume: MonPartenariat) => {
    TestBed.configureTestingModule({ imports: [ResumePartenariat], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ResumePartenariat);
    fixture.detectChanges();
    http.expectOne('/api/partenariats/mon-partenariat').flush(resume);
    fixture.detectChanges();
    http.verify();
    return fixture.nativeElement as HTMLElement;
  };

  it('annonce le partenariat, sa prochaine échéance et les réponses attendues', () => {
    const racine = afficher({
      partenaire: true, conventionsActives: [{ id: 'c1', objet: 'Accord-cadre', dateFin: '2028-06-30', joursRestants: 585, dateEffetResiliation: null }],
      accordsStageEnVigueur: 2, accordsMobiliteEnVigueur: 0, accordsAVenir: 1, reponsesAttendues: 1,
    });
    expect(racine.textContent).toContain('Partenaire de l’EPT');
    expect(racine.textContent).toContain('585 jours');
    expect(racine.textContent).toContain('et 1 à venir');
    expect(racine.textContent).toContain('attendent votre réponse');
    expect(racine.querySelector('.attente')).not.toBeNull();
  });

  it('explique comment devenir partenaire', () => {
    const racine = afficher({
      partenaire: false, conventionsActives: [], accordsStageEnVigueur: 0, accordsMobiliteEnVigueur: 0, accordsAVenir: 0, reponsesAttendues: 0,
    });
    expect(racine.textContent).toContain('Pas encore partenaire');
    expect(racine.querySelector('.positif')).toBeNull();
  });
});
