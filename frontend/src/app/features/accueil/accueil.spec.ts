import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Accueil } from './accueil';

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
    repondre([{ id: 'p1', type: 'PUBLICATION', titre: null, contenu: 'Bonjour EPT', urlImage: '/images/demo.png', publieLe: '2026-10-01T10:00:00Z', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI' },
      { id: 'p2', type: 'PUBLICATION', titre: null, contenu: 'Sans image', urlImage: null, publieLe: '2026-10-01T10:00:00Z', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI' }],
      [{ id: 'e1', titre: 'Forum EPT', dateDebut: '2026-11-01T10:00:00Z', lieu: 'Thiès', description: 'Rencontre', officielEpt: true }],
      [{ id: 'm1', titre: 'Mentorat EPT', dateFin: '2027-01-01', description: 'Accompagnement' }]);
    await fixture.whenStable();
    fixture.detectChanges();
    const racine: HTMLElement = fixture.nativeElement;
    expect(racine.querySelector('h1')?.textContent).toContain('À découvrir dans le réseau');
    expect(racine.querySelectorAll('app-image-publication img')).toHaveLength(1);
    expect(racine.querySelector('app-image-publication img')?.getAttribute('src')).toBe('/images/demo.png');
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

  it('valide le texte, publie avec l’audience choisie et affiche le résultat', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    repondre([], [], []);
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    (root.querySelector('.ouvrir-redaction') as HTMLButtonElement).click();
    fixture.detectChanges();
    const form = root.querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Ajoutez un texte');
    const texte = root.querySelector('textarea')!;
    texte.value = 'Bonjour aux alumni';
    texte.dispatchEvent(new Event('input'));
    const audience = root.querySelector('select')!;
    audience.value = 'ALUMNI';
    audience.dispatchEvent(new Event('input'));
    audience.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    const request = http.expectOne('/api/publications');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ type: 'PUBLICATION', titre: '', contenu: 'Bonjour aux alumni', audience: 'ALUMNI' });
    request.flush({ id: 'new', type: 'PUBLICATION', titre: null, contenu: 'Bonjour aux alumni', audience: 'ALUMNI',
      urlImage: null, publieLe: '2026-10-01T10:00:00Z', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.textContent).toContain('Votre publication a été publiée.');
    expect(root.textContent).toContain('Bonjour aux alumni');
    expect(root.querySelector('form')).toBeNull();
  });

  it('conserve le texte en cas d’échec de publication', async () => {
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    repondre([], [], []);
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    (root.querySelector('.ouvrir-redaction') as HTMLButtonElement).click();
    fixture.detectChanges();
    const texte = root.querySelector('textarea')!;
    texte.value = 'Mon message';
    texte.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    http.expectOne('/api/publications').flush({}, { status: 429, statusText: 'Too Many Requests' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('limite de publications');
    expect(texte.value).toBe('Mon message');
  });

  it('joint une image valide à la publication et libère son aperçu', async () => {
    const creation = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:apercu');
    const liberation = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    repondre([], [], []);
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    (root.querySelector('.ouvrir-redaction') as HTMLButtonElement).click();
    fixture.detectChanges();
    const champ = root.querySelector('input[type=file]') as HTMLInputElement;
    const image = new File(['image'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(champ, 'files', { value: [image], configurable: true });
    champ.dispatchEvent(new Event('change'));
    const texte = root.querySelector('textarea')!;
    texte.value = 'Publication avec image';
    texte.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(root.querySelector('.apercu-publication img')?.getAttribute('src')).toBe('blob:apercu');
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    const requete = http.expectOne('/api/publications');
    expect(requete.request.body).toBeInstanceOf(FormData);
    expect((requete.request.body as FormData).get('image')).toBe(image);
    requete.flush({ id: 'new', type: 'PUBLICATION', titre: null, contenu: 'Publication avec image',
      audience: 'TOUS', urlImage: null, publieLe: '2026-10-01T10:00:00Z', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI' });
    await fixture.whenStable();
    expect(liberation).toHaveBeenCalledWith('blob:apercu');
    creation.mockRestore();
    liberation.mockRestore();
  });
});
