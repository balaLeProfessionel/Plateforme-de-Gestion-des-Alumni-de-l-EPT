import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { PageArticles, ResumeArticle } from '../../../core/services/articles/article';
import { BibliothequeArticles } from './bibliotheque-articles';

const article: ResumeArticle = {
  id: 'a1', publicationId: 'p1', titre: 'De Thiès à Montréal', resume: 'Dix ans dans l’énergie.', theme: 'PARCOURS',
  urlCouverture: null, tempsLecture: 6, statut: 'PUBLIE', modifieLe: '2026-11-01T10:00:00Z', publieLe: '2026-11-01T10:00:00Z',
  auteurId: 'u1', auteurNom: 'Diallo', auteurPrenom: 'Mamadou', auteurRole: 'ALUMNI', auteurPhoto: null,
};
const page = (contenu: ResumeArticle[]): PageArticles => ({ contenu, page: 0, taille: 12, totalElements: contenu.length, totalPages: 1 });

describe('BibliothequeArticles', () => {
  let fixture: ComponentFixture<BibliothequeArticles>;
  let http: HttpTestingController;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    registerLocaleData(localeFr);
    parametres = new BehaviorSubject(convertToParamMap({}));
    await TestBed.configureTestingModule({
      imports: [BibliothequeArticles],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ActivatedRoute, useValue: { queryParamMap: parametres } }],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  async function afficher(params: Record<string, string> = {}) {
    parametres.next(convertToParamMap(params));
    fixture = TestBed.createComponent(BibliothequeArticles);
    fixture.detectChanges();
  }

  it('envoie le thème et la recherche lus dans l’URL, puis affiche les articles', async () => {
    await afficher({ theme: 'CARRIERE', recherche: 'énergie' });
    const requete = http.expectOne((req) => req.url === '/api/articles');
    expect(requete.request.params.get('theme')).toBe('CARRIERE');
    expect(requete.request.params.get('recherche')).toBe('énergie');
    requete.flush(page([article]));
    await fixture.whenStable();
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('app-carte-article h3 a')?.getAttribute('href')).toBe('/articles/a1');
    expect(racine.querySelector('.themes button[aria-pressed="true"]')?.textContent?.trim()).toBe('Carrière');
  });

  it('change de thème en remplaçant l’entrée d’historique', async () => {
    await afficher();
    http.expectOne('/api/articles?page=0&taille=12').flush(page([article]));
    await fixture.whenStable();
    fixture.detectChanges();
    const recherche = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.themes button')]
      .find((bouton) => bouton.textContent?.trim() === 'Recherche')!;
    recherche.click();
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { theme: 'RECHERCHE' }, replaceUrl: true }));
  });

  it('liste les brouillons de l’auteur dans « Mes articles », sans filtres', async () => {
    await afficher({ vue: 'mes' });
    http.expectOne((req) => req.url === '/api/articles/miens').flush(page([{ ...article, statut: 'BROUILLON', publieLe: null }]));
    await fixture.whenStable();
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('.themes')).toBeNull();
    expect(racine.querySelector('.statut')?.textContent?.trim()).toBe('Brouillon');
    expect(racine.querySelector('.onglets a[aria-current="page"]')?.textContent?.trim()).toBe('Mes articles');
  });

  it('invite à écrire quand l’auteur n’a encore rien rédigé', async () => {
    await afficher({ vue: 'mes' });
    http.expectOne((req) => req.url === '/api/articles/miens').flush(page([]));
    await fixture.whenStable();
    fixture.detectChanges();
    const etat = (fixture.nativeElement as HTMLElement).querySelector('.etat');
    expect(etat?.querySelector('h2')?.textContent).toContain('pas encore écrit d’article');
    expect(etat?.querySelector('a')?.getAttribute('href')).toBe('/articles/nouveau');
  });
});
