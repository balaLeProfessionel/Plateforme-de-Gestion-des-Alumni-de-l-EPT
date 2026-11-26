import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { Partenaire } from '../../../core/services/models/partenariat.model';
import { ListePartenaires } from './liste-partenaires';

const partenaire: Partenaire = {
  id: 'o1', nom: 'Sonatel', logoUrl: null, typeOrganisme: 'ENTREPRISE', secteurActivite: 'Télécommunications', pays: 'Sénégal',
  siteWeb: null, partenaireDepuis: '2025-03-01', accordsStage: true, accordsMobilite: false,
};
const page = (contenu: Partenaire[]) => ({ contenu, page: 0, taille: 12, totalElements: contenu.length, totalPages: 1 });

describe('ListePartenaires', () => {
  let http: HttpTestingController;

  const afficher = (params: Record<string, string>, contenu: Partenaire[]) => {
    TestBed.configureTestingModule({
      imports: [ListePartenaires],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: new BehaviorSubject(convertToParamMap(params)) } }],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ListePartenaires);
    fixture.detectChanges();
    http.expectOne('/api/partenaires/secteurs').flush(['Télécommunications']);
    const requete = http.expectOne((r) => r.url === '/api/partenaires');
    requete.flush(page(contenu));
    fixture.detectChanges();
    return { racine: fixture.nativeElement as HTMLElement, params: requete.request.params };
  };

  afterEach(() => http.verify());

  it('lit les filtres dans l’URL et montre les accords en vigueur', () => {
    const { racine, params } = afficher({ type: 'ENTREPRISE', secteur: 'Télécommunications', recherche: 'son' }, [partenaire]);
    expect(params.get('type')).toBe('ENTREPRISE');
    expect(params.get('secteur')).toBe('Télécommunications');
    expect(params.get('recherche')).toBe('son');
    expect(racine.querySelector('a[href="/organismes/o1"]')?.textContent).toContain('Sonatel');
    expect(racine.textContent).toContain('Accords de stage');
    expect(racine.textContent).not.toContain('Accords de mobilité');
    expect(racine.querySelector('[aria-pressed="true"]')?.textContent?.trim()).toBe('Entreprises');
  });

  it('explique l’absence de résultat et propose d’effacer les filtres', () => {
    const { racine } = afficher({ type: 'ONG' }, []);
    expect(racine.textContent).toContain('Aucun partenaire ne correspond');
    expect(racine.textContent).toContain('Effacer les filtres');
  });
});
