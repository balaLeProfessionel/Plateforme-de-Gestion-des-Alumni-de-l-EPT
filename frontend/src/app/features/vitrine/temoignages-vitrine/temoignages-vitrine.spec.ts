import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TemoignagePublic } from '../../../core/services/models/vitrine.model';
import { TemoignagesVitrine } from './temoignages-vitrine';

function temoignage(nom: string): TemoignagePublic {
  return {
    nom,
    promotion: 'D2012',
    fonction: 'Directrice technique',
    organisation: 'Kër Data',
    pays: 'Sénégal',
    texte: `Propos de ${nom}.`,
    urlPhoto: `/api/photos/${nom}.jpg`
  };
}

describe('TemoignagesVitrine', () => {
  async function creer(liste: TemoignagePublic[]) {
    await TestBed.configureTestingModule({
      imports: [TemoignagesVitrine],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(TemoignagesVitrine);
    await fixture.whenStable();
    TestBed.inject(HttpTestingController).expectOne('/api/public/temoignages').flush(liste);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const clic = async (selecteur: string) => {
      element.querySelector<HTMLButtonElement>(selecteur)?.click();
      await fixture.whenStable();
    };
    const active = () => element.querySelector('.diapositive.active');
    return { element, clic, active };
  }

  it('affiche la photo, la citation et l identite complete', async () => {
    const { active } = await creer([temoignage('Awa')]);
    expect(active()?.querySelector('img')?.getAttribute('src')).toBe('/api/photos/Awa.jpg');
    expect(active()?.querySelector('img')?.getAttribute('alt')).toBe('Portrait de Awa');
    expect(active()?.querySelector('blockquote')?.textContent).toContain('Propos de Awa.');
    const identite = active()?.querySelector('figcaption')?.textContent;
    expect(active()?.querySelector('figcaption strong')?.textContent).toContain('Awa (D2012)');
    for (const information of ['Directrice technique', 'Kër Data', 'Sénégal']) {
      expect(identite).toContain(information);
    }
  });

  it('change tout le temoignage avec les fleches et boucle aux extremites', async () => {
    const { element, clic, active } = await creer([temoignage('Awa'), temoignage('Bineta'), temoignage('Cheikh')]);
    expect(element.querySelectorAll('.diapositive.active').length).toBe(1);
    expect(active()?.querySelector('strong')?.textContent).toContain('Awa');

    await clic('.fleche-suivante');
    expect(element.querySelectorAll('.diapositive.active').length).toBe(1);
    expect(active()?.querySelector('blockquote')?.textContent).toContain('Bineta');
    expect(active()?.querySelector('img')?.getAttribute('src')).toContain('Bineta');
    expect(active()?.querySelector('strong')?.textContent).toContain('Bineta');
    expect(element.querySelector('[aria-live]')?.textContent).toContain('Témoignage 2 sur 3');

    await clic('.fleche-precedente');
    await clic('.fleche-precedente');
    expect(active()?.querySelector('strong')?.textContent).toContain('Cheikh');

    await clic('.fleche-suivante');
    expect(active()?.querySelector('strong')?.textContent).toContain('Awa');
  });

  it('nomme les fleches et les retire pour un seul temoignage', async () => {
    const { element } = await creer([temoignage('Awa')]);
    expect(element.querySelector('.fleche')).toBeNull();
  });

  it('ne garde pas de section sans temoignage', async () => {
    const { element } = await creer([]);
    expect(element.querySelector('#temoignages')).toBeNull();
  });

  it('remplace une photo absente par les initiales', async () => {
    const { active } = await creer([{ ...temoignage('Awa'), urlPhoto: null }]);
    expect(active()?.querySelector('img[alt^="Portrait"]')).toBeNull();
    expect(active()?.querySelector('app-avatar-membre')).not.toBeNull();
  });
});
