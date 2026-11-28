import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../../core/services/auth/auth-service';
import { PartenariatOrganisme } from './partenariat-organisme';

describe('PartenariatOrganisme', () => {
  const afficher = (role: string) => {
    TestBed.configureTestingModule({
      imports: [PartenariatOrganisme],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { utilisateur: signal({ role }) } }],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PartenariatOrganisme);
    fixture.componentRef.setInput('organismeId', 'o1');
    fixture.detectChanges();
    return { fixture, http, racine: fixture.nativeElement as HTMLElement };
  };

  it('présente le partenariat à un étudiant', () => {
    const { fixture, http, racine } = afficher('ETUDIANT');
    http.expectOne('/api/partenaires/o1').flush({ partenaireDepuis: '2025-03-01', domaines: ['Stages', 'Recherche'], accordsStage: true, accordsMobilite: true });
    fixture.detectChanges();
    expect(racine.textContent).toContain('Partenaire de l’EPT');
    expect(racine.querySelectorAll('.domaines li')).toHaveLength(2);
    expect(racine.textContent).toContain('stage et mobilité');
    http.verify();
  });

  it('n’affiche rien pour un organisme non partenaire, ni pour un compte organisme', () => {
    const etudiant = afficher('ETUDIANT');
    etudiant.http.expectOne('/api/partenaires/o1').flush(null, { status: 204, statusText: 'No Content' });
    etudiant.fixture.detectChanges();
    expect(etudiant.racine.querySelector('section')).toBeNull();
    etudiant.http.verify();
  });

  it('ne demande rien pour un compte organisme', () => {
    const { http, racine } = afficher('ORGANISME');
    http.expectNone('/api/partenaires/o1');
    expect(racine.querySelector('section')).toBeNull();
  });
});
