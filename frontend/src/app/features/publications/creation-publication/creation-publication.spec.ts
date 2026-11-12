import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RecadreurImage } from '../../../shared/images/recadreur-image';
import { CreationPublication } from './creation-publication';

const SANS_INTERACTION = { nombreJaime: 0, jaime: false, nombreCommentaires: 0, apercuCommentaire: null };

describe('CreationPublication', () => {
  let http: HttpTestingController;
  let naviguer: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CreationPublication],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    naviguer = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });
  afterEach(() => http.verify());

  it('place le curseur dans le message, valide le texte, publie et revient au fil avec la confirmation', async () => {
    const fixture = TestBed.createComponent(CreationPublication);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    expect(document.activeElement?.id).toBe('publication-contenu');
    expect(root.querySelector('h1')?.textContent).toBe('Nouvelle publication');
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
      urlImage: null, publieLe: '2026-10-01T10:00:00Z', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI', ...SANS_INTERACTION });
    await fixture.whenStable();
    expect(naviguer).toHaveBeenCalledWith(['/accueil'], { state: { messagePublication: 'Votre publication a été publiée.' } });
  });

  it('conserve le texte en cas d’échec de publication', async () => {
    const fixture = TestBed.createComponent(CreationPublication);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
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

  /** Ouvre la rédaction, choisit une image et valide son recadrage, comme le ferait un membre. */
  async function preparerImageRecadree() {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:apercu');
    const liberation = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    // jsdom n'implémente ni decode() ni les fenêtres modales.
    HTMLImageElement.prototype.decode ??= () => Promise.resolve();
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockResolvedValue();
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1200);
    vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(1500);
    const ouverture = vi.fn(function (this: HTMLDialogElement) { this.open = true; });
    const fermeture = vi.fn(function (this: HTMLDialogElement) { this.open = false; });
    HTMLDialogElement.prototype.showModal ??= () => {};
    HTMLDialogElement.prototype.close ??= () => {};
    vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(ouverture);
    vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(fermeture);

    const fixture = TestBed.createComponent(CreationPublication);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const champ = root.querySelector('input[type=file]') as HTMLInputElement;
    const original = new File(['image'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(champ, 'files', { value: { 0: original, length: 1, item: () => original }, configurable: true });
    champ.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(ouverture).toHaveBeenCalled();

    const recadree = new File(['recadree'], 'photo.jpg', { type: 'image/jpeg' });
    fixture.debugElement.query(By.directive(RecadreurImage)).componentInstance.recadree.emit(recadree);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fermeture).toHaveBeenCalled();
    return { fixture, root, recadree, liberation };
  }

  afterEach(() => vi.restoreAllMocks());

  it('fait recadrer l’image choisie, publie la version recadrée sans champ de description et libère son aperçu', async () => {
    const { fixture, root, recadree, liberation } = await preparerImageRecadree();
    expect(root.querySelector('.apercu-publication img')?.getAttribute('src')).toBe('blob:apercu');
    // Une image est prête : plus de « Aucun fichier choisi », et le focus reprend sur l’aperçu.
    expect(root.querySelector('input[type=file]')).toBeNull();
    expect(document.activeElement?.textContent?.trim()).toBe('Recadrer');

    const texte = root.querySelector('textarea')!;
    texte.value = 'Publication avec image';
    texte.dispatchEvent(new Event('input'));
    expect(root.querySelector('#publication-texte-alternatif')).toBeNull();
    fixture.detectChanges();

    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    const requete = http.expectOne('/api/publications');
    expect(requete.request.body).toBeInstanceOf(FormData);
    expect((requete.request.body as FormData).get('image')).toBe(recadree);
    const donnees = JSON.parse(await ((requete.request.body as FormData).get('publication') as Blob).text());
    expect(donnees.texteAlternatif).toBeUndefined();
    requete.flush({ id: 'new', type: 'PUBLICATION', titre: null, contenu: 'Publication avec image',
      audience: 'TOUS', urlImage: null, publieLe: '2026-10-01T10:00:00Z', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI', ...SANS_INTERACTION });
    await fixture.whenStable();
    expect(liberation).toHaveBeenCalledWith('blob:apercu');
  });

  it('rend le choix de fichier et le focus quand on retire l’image', async () => {
    const { fixture, root } = await preparerImageRecadree();
    const retirer = [...root.querySelectorAll('.actions-image-publication button')]
      .find((bouton) => bouton.textContent?.includes('Retirer')) as HTMLButtonElement;
    retirer.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root.querySelector('.apercu-publication')).toBeNull();
    expect(document.activeElement?.id).toBe('publication-image');
  });
});
