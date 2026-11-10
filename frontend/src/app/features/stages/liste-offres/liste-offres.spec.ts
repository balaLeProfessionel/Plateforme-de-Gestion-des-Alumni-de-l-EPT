import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { authStages, pageDOffres, uneOffre } from '../testing/donnees-stages';
import { ListeOffres } from './liste-offres';

describe('ListeOffres', () => {
  let fixture: ComponentFixture<ListeOffres>;
  let http: HttpTestingController;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let navigate: ReturnType<typeof vi.fn>;

  const demarrer = (role = 'ETUDIANT', permissions: string[] = [], params: Record<string, string> = {}) => {
    parametres = new BehaviorSubject(convertToParamMap(params));
    TestBed.configureTestingModule({
      imports: [ListeOffres],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametres } },
        { provide: AuthService, useValue: authStages(role, permissions) },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ListeOffres);
    fixture.detectChanges();
    http.expectOne('/api/stages/offres/organismes').flush([{ id: 'org1', nom: 'Kër Data' }]);
    return fixture.nativeElement as HTMLElement;
  };
  const repondre = (offres = [uneOffre()]) => {
    http.expectOne((r) => r.url === '/api/stages/offres').flush(pageDOffres(offres));
    fixture.detectChanges();
  };

  afterEach(() => http.verify());

  it('lit les critères dans l’URL et affiche les offres avec leur date limite', () => {
    const racine = demarrer('ETUDIANT', [], { type: 'PFE', organisme: 'org1', lieu: 'Dakar', closes: 'oui', page: '1' });
    const requete = http.expectOne((r) => r.url === '/api/stages/offres');
    expect(requete.request.params.get('type')).toBe('PFE');
    expect(requete.request.params.get('organisme')).toBe('org1');
    expect(requete.request.params.get('lieu')).toBe('Dakar');
    expect(requete.request.params.get('ouvertes')).toBe('false');
    expect(requete.request.params.get('page')).toBe('1');
    requete.flush(pageDOffres([uneOffre(), uneOffre({ id: 'o2', candidaturesOuvertes: false, titre: 'Ancienne' })]));
    fixture.detectChanges();

    expect(racine.querySelector('.resume')?.textContent).toContain('2 offres');
    expect(racine.querySelector('[aria-pressed="true"]')?.textContent?.trim()).toBe('Projet de fin d’études');
    const cartes = [...racine.querySelectorAll('app-carte-offre')];
    expect(cartes[0].textContent).toContain('Kër Data');
    expect(cartes[0].querySelector('a')?.getAttribute('href')).toBe('/stages/offres/o1');
    expect(cartes[1].textContent).toContain('Candidatures closes');
  });

  it('applique un type, un organisme et la case « ouvertes » sans bouton, en revenant à la première page', () => {
    const racine = demarrer();
    repondre();
    ([...racine.querySelectorAll('.types button')].find((b) => b.textContent?.includes('Alternance')) as HTMLButtonElement).click();
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: { type: 'ALTERNANCE' }, replaceUrl: true }));

    const organisme = racine.querySelector('#filtre-organisme') as HTMLSelectElement;
    organisme.value = 'org1';
    organisme.dispatchEvent(new Event('change'));
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: { organisme: 'org1' } }));

    (racine.querySelector('.case input') as HTMLInputElement).click();
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: { closes: 'oui' } }));
  });

  it('dit quand aucune offre ne correspond et propose d’effacer les filtres', () => {
    const racine = demarrer('ETUDIANT', [], { lieu: 'Kaolack' });
    repondre([]);
    expect(racine.querySelector('.etat h2')?.textContent).toContain('Aucune offre ne correspond');
    ([...racine.querySelectorAll('button')].find((b) => b.textContent?.includes('Effacer les filtres')) as HTMLButtonElement).click();
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: {} }));
  });

  it('montre « Publier une offre » à un organisme et « Gérer les offres » à l’administrateur Stages', () => {
    let racine = demarrer('ORGANISME');
    repondre();
    expect(racine.querySelector('a[href="/stages/publier"]')).not.toBeNull();
    expect(racine.querySelector('a[href="/admin/stages/offres"]')).toBeNull();
    TestBed.resetTestingModule();

    racine = demarrer('ADMIN', ['GERER_STAGES']);
    repondre();
    expect(racine.querySelector('a[href="/stages/publier"]')).toBeNull();
    expect(racine.querySelector('a[href="/admin/stages/offres"]')).not.toBeNull();
  });

  it('affiche une erreur de chargement', () => {
    const racine = demarrer();
    http.expectOne((r) => r.url === '/api/stages/offres').flush({ message: 'Serveur indisponible' }, { status: 500, statusText: 'Erreur' });
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Serveur indisponible');
  });
});
