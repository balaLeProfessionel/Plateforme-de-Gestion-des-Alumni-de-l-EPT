import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { Article } from '../../../core/services/articles/article';
import { AuthService } from '../../../core/services/auth/auth-service';
import { LectureArticle } from './lecture-article';

const publie: Article = {
  id: 'a1', publicationId: 'p1', titre: 'De Thiès à Montréal', resume: 'Dix ans dans l’énergie.', contenu: '## Débuts\n\nTout a commencé à Thiès.',
  theme: 'PARCOURS', urlCouverture: null, tempsLecture: 6, audience: 'TOUS', statut: 'PUBLIE', creeLe: '2026-11-01T10:00:00Z',
  modifieLe: '2026-11-01T10:00:00Z', publieLe: '2026-11-01T10:00:00Z', auteurId: 'u1', auteurNom: 'Diallo', auteurPrenom: 'Mamadou',
  auteurRole: 'ALUMNI', auteurPhoto: null, estAuteur: false, nombreJaime: 3, jaime: false, nombreCommentaires: 0,
};

describe('LectureArticle', () => {
  let fixture: ComponentFixture<LectureArticle>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    registerLocaleData(localeFr);
    await TestBed.configureTestingModule({
      imports: [LectureArticle],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' },
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'lecteur' }) } },
        { provide: ActivatedRoute, useValue: {
          paramMap: of(convertToParamMap({ id: 'a1' })), snapshot: { queryParamMap: convertToParamMap({}) },
        } }],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(LectureArticle);
    fixture.detectChanges();
  });

  const racine = () => fixture.nativeElement as HTMLElement;
  async function recevoir(article: Article) {
    http.expectOne('/api/articles/a1').flush(article);
    await fixture.whenStable();
    fixture.detectChanges();
    // La discussion de la publication porteuse se charge à l’ouverture.
    http.match((req) => req.url === '/api/publications/p1/commentaires').forEach((r) => r.flush({ contenu: [], page: 0, taille: 20, totalElements: 0, totalPages: 0 }));
  }

  it('affiche l’article, son corps mis en forme et ses « J’aime », sans outils pour un lecteur', async () => {
    await recevoir(publie);
    expect(racine().querySelector('h1')?.textContent).toBe('De Thiès à Montréal');
    expect(racine().querySelector('.theme')?.textContent).toBe('Parcours');
    expect(racine().querySelector('app-contenu-article h2')?.textContent).toBe('Débuts');
    expect(racine().querySelector('.meta')?.textContent).toContain('6 min de lecture');
    expect(racine().querySelector('app-bouton-jaime')?.textContent).toContain('3');
    expect(racine().querySelector('.outils')).toBeNull();
    http.verify();
  });

  it('permet à l’auteur de publier son brouillon', async () => {
    await recevoir({ ...publie, statut: 'BROUILLON', publicationId: null, publieLe: null, estAuteur: true });
    expect(racine().querySelector('.brouillon')?.textContent).toContain('vous seul');
    expect(racine().querySelector('app-bouton-jaime')).toBeNull();
    const publier = [...racine().querySelectorAll<HTMLButtonElement>('.outils button')].find((b) => b.textContent?.includes('Publier'))!;
    publier.click();
    http.expectOne((req) => req.method === 'PATCH' && req.url === '/api/articles/a1/publier').flush({ ...publie, estAuteur: true });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine().querySelector('.succes')?.textContent).toContain('est publié');
    http.match(() => true).forEach((r) => r.flush({ contenu: [], page: 0, taille: 20, totalElements: 0, totalPages: 0 }));
  });

  it('demande confirmation avant de supprimer, puis revient à « Mes articles »', async () => {
    await recevoir({ ...publie, estAuteur: true });
    const supprimer = [...racine().querySelectorAll<HTMLButtonElement>('.outils button')].find((b) => b.textContent?.includes('Supprimer'))!;
    supprimer.click();
    fixture.detectChanges();
    expect(supprimer.getAttribute('aria-expanded')).toBe('true');
    (racine().querySelector('#confirmation-suppression .danger') as HTMLButtonElement).click();
    http.expectOne((req) => req.method === 'DELETE' && req.url === '/api/articles/a1').flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/articles'], { queryParams: { vue: 'mes' } });
  });

  it('explique qu’un article introuvable n’est pas disponible', async () => {
    http.expectOne('/api/articles/a1').flush({ message: 'Cet article n’est pas disponible.' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine().querySelector('.vide h1')?.textContent).toContain('n’est pas disponible');
    http.verify();
  });
});
