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
import { compte, pageDe as page } from '../testing/donnees-admin';
import { Comptes } from './comptes';

describe('Comptes', () => {
  let fixture: ComponentFixture<Comptes>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const actualiser = vi.fn();
  const resume = signal<ResumeComptes | null>({ enAttente: 2, actifs: 40, suspendus: 1, enAttenteParRole: { ALUMNI: 2 } });

  beforeEach(() => {
    actualiser.mockClear();
    parametres = new BehaviorSubject(convertToParamMap({ statut: 'SUSPENDU', recherche: 'diop', role: 'INCONNU', page: '3' }));
    TestBed.configureTestingModule({
      imports: [Comptes],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametres, snapshot: { queryParamMap: parametres.value } } },
        { provide: CompteurInscriptions, useValue: { resume, actualiser } },
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(Comptes);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('envoie les critères valides de l’URL et ignore un rôle inconnu', async () => {
    const requete = http.expectOne((req) => req.url === '/api/admin/comptes');
    expect(requete.request.params.get('statut')).toBe('SUSPENDU');
    expect(requete.request.params.get('recherche')).toBe('diop');
    expect(requete.request.params.has('role')).toBe(false);
    expect(requete.request.params.get('page')).toBe('2');
    requete.flush(page([]));
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('#recherche-compte') as HTMLInputElement).value).toBe('diop');
    const filtres = [...fixture.nativeElement.querySelectorAll('.statuts button')] as HTMLButtonElement[];
    expect(filtres.map((bouton) => bouton.textContent?.replace(/\s+/g, ' ').trim()))
      .toEqual(['Tous 43', 'Actifs 40', 'En attente 2', 'Suspendus 1']);
    expect(filtres.map((bouton) => bouton.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'true']);
    expect(fixture.nativeElement.querySelector('.etat h2')?.textContent).toContain('Aucun compte');
  });

  it('change de statut et de type de compte dans l’URL', () => {
    http.expectOne((req) => req.url === '/api/admin/comptes').flush(page([]));

    (fixture.nativeElement.querySelectorAll('.statuts button')[1] as HTMLButtonElement).click();
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({
      queryParams: { recherche: 'diop', statut: 'ACTIF' }, replaceUrl: true,
    }));

    const choix = fixture.nativeElement.querySelector('#role-compte') as HTMLSelectElement;
    choix.value = 'ORGANISME';
    choix.dispatchEvent(new Event('change'));
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({
      queryParams: { recherche: 'diop', role: 'ORGANISME', statut: 'SUSPENDU' }, replaceUrl: true,
    }));
  });

  it('écrit la page dans l’URL sans remplacer l’entrée d’historique', () => {
    http.expectOne((req) => req.url === '/api/admin/comptes').flush(page([compte()], 2, 5));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.pagination button:last-child') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({
      queryParams: { recherche: 'diop', statut: 'SUSPENDU', page: '4' }, replaceUrl: false,
    }));
  });

  it('reprend dans le champ la recherche de l’URL après un retour arrière', async () => {
    http.expectOne((req) => req.url === '/api/admin/comptes').flush(page([]));
    parametres.next(convertToParamMap({ recherche: 'sow' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    http.expectOne((req) => req.url === '/api/admin/comptes' && req.params.get('recherche') === 'sow').flush(page([]));
    expect((fixture.nativeElement.querySelector('#recherche-compte') as HTMLInputElement).value).toBe('sow');
  });

  it('recharge la liste et les compteurs après une décision', async () => {
    http.expectOne((req) => req.url === '/api/admin/comptes').flush(page([compte({ statutCompte: 'SUSPENDU' })]));
    await fixture.whenStable();
    fixture.detectChanges();

    // « Réactiver » ouvre le panneau, « Confirmer la réactivation » envoie.
    (fixture.nativeElement.querySelector('.actions button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.actions button') as HTMLButtonElement).click();
    http.expectOne('/api/admin/comptes/c1/reactiver').flush(compte());
    await fixture.whenStable();
    fixture.detectChanges();

    http.expectOne((req) => req.url === '/api/admin/comptes').flush(page([]));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(actualiser).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('Compte de Awa Diop réactivé.');
  });
});
