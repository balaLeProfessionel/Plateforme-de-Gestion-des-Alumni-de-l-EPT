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

  const PUBLICATION = { type: 'PUBLICATION', titre: null, urlImage: null, publieLe: '2026-10-01T10:00:00Z',
    auteurId: 'a1', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI', ...SANS_INTERACTION };

  function page(contenu: unknown[], numero = 0, derniere = true) {
    return { contenu, page: numero, taille: 10, derniere, reference: '2026-11-03T12:00:00Z' };
  }

  function repondre(contenu: unknown[] = []): void {
    http.expectOne((req) => req.url === '/api/fil' && req.params.get('page') === '0').flush(page(contenu));
  }

  it('affiche les cartes du fil personnalisé avec la raison de chaque suggestion', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Chargement des nouveautés');
    repondre([
      { type: 'PUBLICATION', raison: 'De votre promotion 2020',
        publication: { ...PUBLICATION, id: 'p1', contenu: 'Bonjour EPT', urlImage: '/images/demo.png' } },
      { type: 'EVENEMENT', raison: null, evenement: { id: 'e1', titre: 'Forum EPT', dateDebut: '2026-11-01T10:00:00Z',
        lieu: 'Thiès', description: 'Rencontre', officielEpt: true, nombreParticipants: 4, maReponse: null } },
      { type: 'PROGRAMME', raison: null, programme: { id: 'm1', titre: 'Mentorat EPT', dateFin: '2027-01-01',
        description: 'Accompagnement', nombreMentors: 2, jeParticipe: false } },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();
    const racine: HTMLElement = fixture.nativeElement;
    expect(racine.querySelector('h1')?.textContent).toContain('Fil d’actualité');
    expect(racine.querySelector('app-image-publication img')?.getAttribute('src')).toBe('/images/demo.png');
    expect(racine.querySelectorAll('.raison')).toHaveLength(1);
    expect(racine.querySelector('.raison')?.textContent).toContain('Suggéré pour vous : De votre promotion 2020');
    expect(racine.textContent).toContain('Bonjour EPT');
    expect(racine.querySelector('a[href="/evenements/e1"]')).not.toBeNull();
    expect(racine.querySelector('a[href="/mentorat/programmes/m1"]')).not.toBeNull();
    expect(racine.textContent).toContain('2 mentors volontaires');
    expect(racine.querySelector('.suite')).toBeNull();
  });

  it('charge la suite au même instant de référence, sans répéter une carte', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    http.expectOne((req) => req.url === '/api/fil').flush(page([
      { type: 'PUBLICATION', raison: null, publication: { ...PUBLICATION, id: 'p1', contenu: 'Première' } }], 0, false));
    await fixture.whenStable();
    fixture.detectChanges();
    const racine: HTMLElement = fixture.nativeElement;
    (racine.querySelector('.suite button') as HTMLButtonElement).click();
    const suite = http.expectOne((req) => req.url === '/api/fil' && req.params.get('page') === '1');
    expect(suite.request.params.get('reference')).toBe('2026-11-03T12:00:00Z');
    suite.flush(page([
      { type: 'PUBLICATION', raison: null, publication: { ...PUBLICATION, id: 'p1', contenu: 'Première' } },
      { type: 'PUBLICATION', raison: null, publication: { ...PUBLICATION, id: 'p2', contenu: 'Seconde' } }], 1, true));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelectorAll('app-carte-publication')).toHaveLength(2);
    expect(racine.textContent).toContain('Seconde');
    expect(racine.querySelector('.suite')).toBeNull();
  });

  it('ne répète pas la même raison sur les cartes qui se suivent', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    const suivie = (id: string, raison: string | null) =>
      ({ type: 'PUBLICATION', raison, publication: { ...PUBLICATION, id, contenu: id } });
    repondre([suivie('p1', 'Vous réagissez souvent à ses publications'), suivie('p2', 'Vous réagissez souvent à ses publications'),
      suivie('p3', 'De votre promotion 2020'), suivie('p4', 'Vous réagissez souvent à ses publications'),
      suivie('p5', 'Vous réagissez souvent à ses publications')]);
    await fixture.whenStable();
    fixture.detectChanges();
    const raisons = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.cartes > li')]
      .map((li) => li.querySelector('.raison')?.textContent?.replace('Suggéré pour vous :', '').trim() ?? null);
    expect(raisons).toEqual(['Vous réagissez souvent à ses publications', null, 'De votre promotion 2020', null,
      'Vous réagissez souvent à ses publications']);
  });

  it('signale une erreur de chargement et permet de réessayer', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    http.expectOne((req) => req.url === '/api/fil').flush({}, { status: 500, statusText: 'Erreur' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger le fil d’actualité.');
    (fixture.nativeElement.querySelector('.erreur button') as HTMLButtonElement).click();
    repondre([]);
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
    repondre();
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
