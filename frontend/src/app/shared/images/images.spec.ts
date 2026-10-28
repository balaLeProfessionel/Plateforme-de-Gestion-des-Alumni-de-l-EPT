import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AvatarMembre } from './avatar-membre';
import { chargerImagePourRecadrage } from './charger-image';
import { FORMAT_EVENEMENT, FORMAT_PHOTO_PROFIL } from './recadrage';
import { RecadreurImage } from './recadreur-image';
import { VisuelEvenement } from './visuel-evenement';

describe('AvatarMembre', () => {
  function afficher(entrees: Record<string, unknown>): HTMLElement {
    const fixture = TestBed.createComponent(AvatarMembre);
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('affiche les initiales aux couleurs du rôle, de façon décorative', () => {
    const avatar = afficher({ prenom: 'Awa', nom: 'Diop', roleMembre: 'ETUDIANT', taille: 4 });
    expect(avatar.textContent?.trim()).toBe('AD');
    expect(avatar.getAttribute('data-role')).toBe('ETUDIANT');
    expect(avatar.style.getPropertyValue('--taille')).toBe('4rem');
    expect(avatar.querySelector('.initiales')?.getAttribute('aria-hidden')).toBe('true');
    expect(avatar.hasAttribute('role')).toBe(false);
  });

  it('prend les deux premiers mots d’un nom d’organisme et une icône sans nom', () => {
    expect(afficher({ nom: 'Sonatel Orange Sénégal', roleMembre: 'ORGANISME' }).textContent?.trim()).toBe('SO');
    expect(afficher({ nom: '' }).querySelector('.pi-user')).not.toBeNull();
  });

  it('remplace une photo en erreur par les initiales, lisibles seules si un libellé est donné', () => {
    const fixture = TestBed.createComponent(AvatarMembre);
    fixture.componentRef.setInput('urlPhoto', '/api/photos/absente.jpg');
    fixture.componentRef.setInput('prenom', 'Awa');
    fixture.componentRef.setInput('nom', 'Diop');
    fixture.componentRef.setInput('libelle', 'Photo de Awa Diop');
    fixture.detectChanges();
    const avatar = fixture.nativeElement as HTMLElement;
    expect(avatar.querySelector('img')?.getAttribute('alt')).toBe('Photo de Awa Diop');

    avatar.querySelector('img')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const initiales = avatar.querySelector('.initiales');
    expect(avatar.querySelector('img')).toBeNull();
    expect(initiales?.getAttribute('role')).toBe('img');
    expect(initiales?.getAttribute('aria-label')).toBe('Photo de Awa Diop');

    fixture.componentRef.setInput('urlPhoto', '/api/photos/nouvelle.jpg');
    fixture.detectChanges();
    expect(avatar.querySelector('img')?.getAttribute('src')).toBe('/api/photos/nouvelle.jpg');
  });
});

describe('VisuelEvenement', () => {
  function afficher(entrees: Record<string, unknown>): HTMLElement {
    const fixture = TestBed.createComponent(VisuelEvenement);
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('affiche l’image fournie avec son texte alternatif', () => {
    const visuel = afficher({ urlImage: '/api/evenement-images/a.jpg', alternative: 'Illustration du gala', chargementDiffere: true });
    const image = visuel.querySelector('img');
    expect(image?.getAttribute('alt')).toBe('Illustration du gala');
    expect(image?.getAttribute('loading')).toBe('lazy');
    expect(visuel.querySelector('.affiche')).toBeNull();
  });

  it('génère une affiche datée décorative sans image', () => {
    const visuel = afficher({ dateDebut: '2026-10-28T18:00:00Z', lieu: 'Thiès', officiel: true });
    const affiche = visuel.querySelector('.affiche');
    expect(affiche?.getAttribute('aria-hidden')).toBe('true');
    expect(affiche?.querySelector('.date strong')?.textContent?.trim()).toBe('28');
    expect(affiche?.querySelector('.date small')?.textContent?.trim()).toBe('2026');
    expect(affiche?.querySelector('.lieu')?.textContent).toContain('Thiès');
    expect(affiche?.querySelector('.officiel')?.textContent).toContain('Officiel EPT');
  });

  it('garde une affiche lisible sans date ni lieu', () => {
    const visuel = afficher({});
    expect(visuel.querySelector('.affiche .icone')).not.toBeNull();
    expect(visuel.querySelector('.affiche .lieu')).toBeNull();
    expect(visuel.querySelector('.affiche .officiel')).toBeNull();
  });
});

describe('chargerImagePourRecadrage', () => {
  let dimensions = { largeur: 1600, hauteur: 900 };
  let decodage: () => Promise<void> = () => Promise.resolve();

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:image');
    URL.revokeObjectURL = vi.fn();
    // jsdom n'implémente pas decode(), présent dans tous les navigateurs modernes.
    HTMLImageElement.prototype.decode ??= () => Promise.resolve();
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockImplementation(() => decodage());
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockImplementation(() => dimensions.largeur);
    vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockImplementation(() => dimensions.hauteur);
  });

  afterEach(() => vi.restoreAllMocks());

  const fichier = (type = 'image/jpeg', taille = 10) => new File([new Uint8Array(taille)], 'image', { type });

  it('accepte une image assez grande', async () => {
    dimensions = { largeur: 800, hauteur: 450 };
    const image = await chargerImagePourRecadrage(fichier(), FORMAT_EVENEMENT);
    expect(image.src).toBe('blob:image');
  });

  it('refuse le mauvais type, le poids, une image illisible ou trop petite', async () => {
    await expect(chargerImagePourRecadrage(fichier('image/gif'), FORMAT_EVENEMENT)).rejects.toThrow('JPEG ou PNG');
    await expect(chargerImagePourRecadrage(fichier('image/png', 5 * 1024 * 1024 + 1), FORMAT_EVENEMENT))
      .rejects.toThrow('5 Mo');

    decodage = () => Promise.reject(new Error('corrompue'));
    await expect(chargerImagePourRecadrage(fichier(), FORMAT_EVENEMENT)).rejects.toThrow('pas une image lisible');

    decodage = () => Promise.resolve();
    dimensions = { largeur: 199, hauteur: 400 };
    await expect(chargerImagePourRecadrage(fichier(), FORMAT_PHOTO_PROFIL))
      .rejects.toThrow('au moins 200 × 200 pixels');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:image');
  });
});

describe('RecadreurImage', () => {
  function image(largeur: number, hauteur: number): HTMLImageElement {
    const element = new Image();
    Object.defineProperty(element, 'naturalWidth', { value: largeur });
    Object.defineProperty(element, 'naturalHeight', { value: hauteur });
    return element;
  }

  function creer(largeur = 3200, hauteur = 1200) {
    const fixture = TestBed.createComponent(RecadreurImage);
    fixture.componentRef.setInput('image', image(largeur, hauteur));
    fixture.componentRef.setInput('format', FORMAT_EVENEMENT);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    return { fixture, racine, cadre: racine.querySelector('.cadre') as HTMLElement };
  }

  const touche = (element: HTMLElement, key: string) =>
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

  it('présente un cadre 16:9 focalisable et décrit au clavier', () => {
    const { racine, cadre } = creer();
    expect(cadre.getAttribute('tabindex')).toBe('0');
    expect(cadre.style.aspectRatio).toBe('1600 / 900');
    expect(cadre.getAttribute('aria-describedby')).toBe('aide-recadrage');
    expect(racine.querySelector('#aide-recadrage')?.textContent).toContain('flèches');
    expect(racine.querySelector('label[for="zoom-recadrage"]')).not.toBeNull();
  });

  it('déplace l’image aux flèches, zoome avec + et recentre avec 0', () => {
    const { fixture, cadre } = creer();
    const position = () => (cadre.querySelector('img') as HTMLImageElement).style.left;
    const depart = position();

    touche(cadre, 'ArrowRight');
    fixture.detectChanges();
    expect(position()).not.toBe(depart);

    touche(cadre, '+');
    fixture.detectChanges();
    const zoom = racineZoom(fixture.nativeElement);
    expect(Number(zoom.value)).toBeGreaterThan(1);
    expect(zoom.getAttribute('aria-valuetext')).toBe('Zoom 110 %');

    touche(cadre, '0');
    fixture.detectChanges();
    expect(position()).toBe(depart);
    expect(Number(racineZoom(fixture.nativeElement).value)).toBe(1);
  });

  it('désactive le zoom quand l’image a juste la taille minimale', () => {
    const { racine } = creer(800, 450);
    expect(racineZoom(racine).disabled).toBe(true);
  });

  it('produit un JPEG à la taille exacte du format', async () => {
    const dessin = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      { fillRect: vi.fn(), drawImage: dessin, set fillStyle(_: string) {}, set imageSmoothingQuality(_: string) {} } as never);
    let largeurToile = 0;
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, rappel) {
      largeurToile = this.width;
      rappel(new Blob(['jpeg'], { type: 'image/jpeg' }));
    });
    const { fixture, racine } = creer();
    const fichiers: File[] = [];
    fixture.componentInstance.recadree.subscribe((fichier) => fichiers.push(fichier));

    (racine.querySelector('.actions .principal') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(fichiers[0].type).toBe('image/jpeg');
    expect(largeurToile).toBe(1600);
    expect(dessin.mock.calls[0].slice(5)).toEqual([0, 0, 1600, 900]);
    vi.restoreAllMocks();
  });

  it('signale l’annulation', () => {
    const { fixture, racine } = creer();
    let annulations = 0;
    fixture.componentInstance.annulee.subscribe(() => annulations++);
    (racine.querySelector('.actions .secondaire') as HTMLButtonElement).click();
    expect(annulations).toBe(1);
  });

  function racineZoom(racine: HTMLElement): HTMLInputElement {
    return racine.querySelector('#zoom-recadrage') as HTMLInputElement;
  }
});
