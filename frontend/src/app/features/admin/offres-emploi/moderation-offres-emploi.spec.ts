import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { OffreAModerer } from '../../../core/services/models/offre-emploi.model';
import { Page } from '../../../core/services/models/mentorat.model';
import { uneOffreGeree } from '../../offres-emploi/testing/donnees-offres-emploi';
import { ModerationOffresEmploi } from './moderation-offres-emploi';

const page = (contenu: OffreAModerer[]): Page<OffreAModerer> => ({ contenu, page: 0, taille: 20, totalElements: contenu.length, totalPages: 1 });

describe('ModerationOffresEmploi', () => {
  let harnais: RouterTestingHarness;
  let http: HttpTestingController;

  const ouvrir = async (url = '/admin/offres-emploi') => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(),
        provideRouter([{ path: 'admin/offres-emploi', component: ModerationOffresEmploi }])],
    });
    http = TestBed.inject(HttpTestingController);
    harnais = await RouterTestingHarness.create();
    await harnais.navigateByUrl(url);
    return harnais.routeNativeElement as HTMLElement;
  };
  const rendre = async () => {
    await harnais.fixture.whenStable();
    harnais.detectChanges();
  };
  const onglet = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('.onglets button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('ouvre la file à vérifier, puis passe aux offres signalées par l’URL', async () => {
    const racine = await ouvrir();
    http.expectOne('/api/admin/offres-emploi?file=A_VERIFIER&page=0&taille=20')
      .flush(page([{ offre: uneOffreGeree({ statut: 'SOUMISE' }), signalements: [] }]));
    await rendre();
    expect(onglet(racine, 'À vérifier').getAttribute('aria-pressed')).toBe('true');
    expect(racine.querySelectorAll('app-carte-offre-a-moderer')).toHaveLength(1);

    onglet(racine, 'Signalées').click();
    await rendre();
    expect(TestBed.inject(Router).url).toBe('/admin/offres-emploi?file=SIGNALEES');
    http.expectOne('/api/admin/offres-emploi?file=SIGNALEES&page=0&taille=20').flush(page([]));
    await rendre();
    expect(racine.querySelector('.etat h2')?.textContent).toContain('Aucune offre signalée');
  });

  it('recharge la file et le compteur après une décision', async () => {
    const racine = await ouvrir();
    http.expectOne('/api/admin/offres-emploi?file=A_VERIFIER&page=0&taille=20')
      .flush(page([{ offre: uneOffreGeree({ statut: 'SOUMISE' }), signalements: [] }]));
    await rendre();
    ([...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Publier') as HTMLButtonElement).click();
    http.expectOne('/api/admin/offres-emploi/g1/publier').flush({ offre: uneOffreGeree(), signalements: [] });
    await rendre();
    http.expectOne('/api/admin/offres-emploi/compteur').flush({ aVerifier: 0, signalees: 0 });
    http.expectOne('/api/admin/offres-emploi?file=A_VERIFIER&page=0&taille=20').flush(page([]));
    await rendre();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('est publiée');
    expect(racine.querySelector('.etat h2')?.textContent).toContain('Aucune offre à vérifier');
  });

  it('revient à la page précédente quand la dernière offre d’une page est traitée', async () => {
    const racine = await ouvrir('/admin/offres-emploi?page=1');
    http.expectOne('/api/admin/offres-emploi?file=A_VERIFIER&page=1&taille=20')
      .flush(page([{ offre: uneOffreGeree({ statut: 'SOUMISE' }), signalements: [] }]));
    await rendre();
    ([...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Publier') as HTMLButtonElement).click();
    http.expectOne('/api/admin/offres-emploi/g1/publier').flush({ offre: uneOffreGeree(), signalements: [] });
    await rendre();
    http.expectOne('/api/admin/offres-emploi/compteur').flush({ aVerifier: 20, signalees: 0 });
    http.expectOne('/api/admin/offres-emploi?file=A_VERIFIER&page=1&taille=20').flush(page([]));
    await rendre();
    http.expectOne('/api/admin/offres-emploi?file=A_VERIFIER&page=0&taille=20')
      .flush(page([{ offre: uneOffreGeree({ id: 'g2', statut: 'SOUMISE' }), signalements: [] }]));
    await rendre();
    expect(TestBed.inject(Router).url).toBe('/admin/offres-emploi');
    expect(racine.querySelectorAll('app-carte-offre-a-moderer')).toHaveLength(1);
  });

  it('signale un chargement impossible', async () => {
    const racine = await ouvrir('/admin/offres-emploi?file=PUBLIEES');
    http.expectOne('/api/admin/offres-emploi?file=PUBLIEES&page=0&taille=20')
      .flush({ message: 'Accès refusé' }, { status: 403, statusText: 'Forbidden' });
    await rendre();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Accès refusé');
  });
});
