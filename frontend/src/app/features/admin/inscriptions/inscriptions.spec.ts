import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { AuthService } from '../../../core/services/auth/auth-service';
import { ResumeComptes } from '../../../core/services/models/admin.model';
import { pageDe } from '../testing/donnees-admin';
import { Inscriptions } from './inscriptions';

describe('Inscriptions', () => {
  let fixture: ComponentFixture<Inscriptions>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;
  const resume = signal<ResumeComptes | null>({
    enAttente: 5, actifs: 40, suspendus: 1, enAttenteParRole: { ALUMNI: 3, ORGANISME: 2 },
  });

  beforeEach(() => {
    const parametres = new BehaviorSubject(convertToParamMap({ role: 'ORGANISME', statut: 'ACTIF' }));
    TestBed.configureTestingModule({
      imports: [Inscriptions],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametres, snapshot: { queryParamMap: parametres.value } } },
        { provide: CompteurInscriptions, useValue: { resume, actualiser: vi.fn() } },
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(Inscriptions);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('ne montre que les inscriptions en attente du type choisi dans l’URL', () => {
    const requete = http.expectOne((req) => req.url === '/api/admin/comptes');
    // Le statut de l’URL est ignoré : cette page ne liste que les inscriptions en attente.
    expect(requete.request.params.get('statut')).toBe('EN_ATTENTE');
    expect(requete.request.params.get('role')).toBe('ORGANISME');
    requete.flush(pageDe([]));
  });

  it('propose un filtre par type ayant des inscriptions, avec leur nombre', () => {
    http.expectOne((req) => req.url === '/api/admin/comptes').flush(pageDe([]));
    fixture.detectChanges();
    const filtres = [...fixture.nativeElement.querySelectorAll('.types button')] as HTMLButtonElement[];

    expect(filtres.map((bouton) => bouton.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['Tous 5', 'Alumni 3', 'Organisme 2']);
    expect(filtres.map((bouton) => bouton.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true']);

    filtres[1].click();
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: { role: 'ALUMNI' }, replaceUrl: true }));
  });
});
