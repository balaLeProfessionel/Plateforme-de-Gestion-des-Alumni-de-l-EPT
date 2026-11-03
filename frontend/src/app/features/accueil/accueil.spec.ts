import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Accueil } from './accueil';

const SANS_INTERACTION = { nombreJaime: 0, jaime: false, nombreCommentaires: 0, apercuCommentaire: null };

describe('Accueil', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Accueil],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function repondre(publications: unknown[], evenements: unknown[], programmes: unknown[]): void {
    http.expectOne((req) => req.url === '/api/publications').flush({ contenu: publications });
    http.expectOne((req) => req.url === '/api/evenements').flush({ contenu: evenements });
    http.expectOne('/api/mentorat/programmes/ouverts').flush(programmes);
  }

  it('affiche les cartes de plusieurs modules, avec et sans image', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Chargement des nouveautés');
    repondre([{ id: 'p1', type: 'PUBLICATION', titre: null, contenu: 'Bonjour EPT', urlImage: '/images/demo.png', publieLe: '2026-10-01T10:00:00Z', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI', ...SANS_INTERACTION },
      { id: 'p2', type: 'PUBLICATION', titre: null, contenu: 'Sans image', urlImage: null, publieLe: '2026-10-01T10:00:00Z', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI', ...SANS_INTERACTION }],
      [{ id: 'e1', titre: 'Forum EPT', dateDebut: '2026-11-01T10:00:00Z', lieu: 'Thiès', description: 'Rencontre', officielEpt: true }],
      [{ id: 'm1', titre: 'Mentorat EPT', dateFin: '2027-01-01', description: 'Accompagnement' }]);
    await fixture.whenStable();
    fixture.detectChanges();
    const racine: HTMLElement = fixture.nativeElement;
    expect(racine.querySelector('h1')?.textContent).toContain('Fil d’actualité');
    expect(racine.querySelectorAll('app-image-publication img')).toHaveLength(1);
    expect(racine.querySelector('app-image-publication img')?.getAttribute('src')).toBe('/images/demo.png');
    // Sans description fournie, le texte alternatif nomme au moins l’auteur.
    expect(racine.querySelector('app-image-publication img')?.getAttribute('alt')).toBe('Image partagée par Awa Diop');
    expect(racine.textContent).toContain('Sans image');
    expect(racine.textContent).toContain('Bonjour EPT');
    expect(racine.textContent).toContain('Forum EPT');
    expect(racine.textContent).toContain('Mentorat EPT');
    expect(racine.querySelector('a[href="/evenements/e1"]')).not.toBeNull();
    expect(racine.querySelector('a[href="/mentorat/programmes/m1"]')).not.toBeNull();
  });

  it('conserve les autres cartes en cas d’erreur et permet de réessayer', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    http.expectOne((req) => req.url === '/api/publications').flush({}, { status: 500, statusText: 'Erreur' });
    http.expectOne((req) => req.url === '/api/evenements').flush({ contenu: [] });
    http.expectOne('/api/mentorat/programmes/ouverts').flush([{ id: 'm1', titre: 'Mentorat EPT', dateFin: '2027-01-01' }]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger : publications');
    expect(fixture.nativeElement.textContent).toContain('Mentorat EPT');
    (fixture.nativeElement.querySelector('.erreur button') as HTMLButtonElement).click();
    repondre([], [], []);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Il n’y a rien à afficher');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('invite à publier dans l’espace dédié et confirme une publication à son retour', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'getCurrentNavigation').mockReturnValue(
      { extras: { state: { messagePublication: 'Votre publication a été publiée.' } } } as unknown as ReturnType<Router['getCurrentNavigation']>);
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    repondre([], [], []);
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const invitation = root.querySelector('a.invitation');
    expect(invitation?.getAttribute('href')).toBe('/publications/nouvelle');
    expect(invitation?.textContent).toContain('Créer une publication');
    expect(root.querySelector('form')).toBeNull();
    expect(root.querySelector('.confirmation')?.textContent).toContain('Votre publication a été publiée.');
    (root.querySelector('.confirmation button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('.confirmation')).toBeNull();
  });

  afterEach(() => vi.restoreAllMocks());
});
