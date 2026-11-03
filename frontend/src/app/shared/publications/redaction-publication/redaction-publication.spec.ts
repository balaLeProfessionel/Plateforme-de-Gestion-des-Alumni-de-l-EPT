import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RedactionPublication } from './redaction-publication';

describe('RedactionPublication (administration)', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 3, 12));
  });
  afterEach(() => { http.verify(); vi.useRealTimers(); });

  function ouvrir() {
    const fixture = TestBed.createComponent(RedactionPublication);
    fixture.componentRef.setInput('types', ['ANNONCE_OFFICIELLE', 'APPEL_PROJET']);
    fixture.detectChanges();
    const racine: HTMLElement = fixture.nativeElement;
    (racine.querySelector('.ouvrir-redaction') as HTMLButtonElement).click();
    fixture.detectChanges();
    const saisir = (selecteur: string, valeur: string) => {
      const champ = racine.querySelector(selecteur) as HTMLInputElement;
      champ.value = valeur;
      champ.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const soumettre = () => {
      racine.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      fixture.detectChanges();
    };
    const choisirType = (libelle: string) => {
      ([...racine.querySelectorAll('.choix-type button')].find((b) => b.textContent?.includes(libelle)) as HTMLButtonElement).click();
      fixture.detectChanges();
    };
    return { fixture, racine, saisir, soumettre, choisirType };
  }

  it('propose les deux types officiels, l’annonce d’abord, avec un titre obligatoire', () => {
    const { racine, saisir, soumettre } = ouvrir();
    expect(racine.querySelector('h2')?.textContent).toBe('Nouvelle annonce officielle');
    expect([...racine.querySelectorAll('.choix-type button')].map((b) => [b.textContent?.trim(), b.getAttribute('aria-pressed')]))
      .toEqual([['Annonce officielle', 'true'], ['Appel à projet', 'false']]);
    expect(racine.querySelector('#publication-date-limite')).toBeNull();
    saisir('textarea', 'Les inscriptions ouvrent lundi.');
    soumettre();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Donnez un titre');
  });

  it('demande une date limite à venir pour un appel à projet et l’envoie', async () => {
    const { fixture, racine, saisir, soumettre, choisirType } = ouvrir();
    let publiee: unknown;
    fixture.componentInstance.publiee.subscribe((p) => (publiee = p));
    choisirType('Appel à projet');
    expect(racine.querySelector('h2')?.textContent).toBe('Nouvel appel à projet');
    saisir('#publication-titre', 'Fonds d’innovation');
    saisir('textarea', 'Proposez vos projets.');
    soumettre();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Indiquez la date limite');
    saisir('#publication-date-limite', '2026-11-02');
    soumettre();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('déjà passée');

    saisir('#publication-date-limite', '2026-11-03');
    soumettre();
    const requete = http.expectOne('/api/publications');
    expect(requete.request.body).toEqual({ type: 'APPEL_PROJET', titre: 'Fonds d’innovation', contenu: 'Proposez vos projets.',
      audience: 'TOUS', dateLimite: '2026-11-03' });
    requete.flush({ id: 'n', type: 'APPEL_PROJET' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(publiee).toEqual({ id: 'n', type: 'APPEL_PROJET' });
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('L’appel à projet est diffusé');
  });

  it('affiche le message du serveur quand il refuse la publication', async () => {
    const { fixture, racine, saisir, soumettre } = ouvrir();
    saisir('#publication-titre', 'Rentrée');
    saisir('textarea', 'Texte');
    soumettre();
    http.expectOne('/api/publications').flush({ message: 'Seule l\'administration peut publier une annonce officielle.' },
      { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Seule l\'administration');
  });
});
