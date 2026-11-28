import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { SectionGoogle } from './section-google';

describe('SectionGoogle', () => {
  let fixture: ComponentFixture<SectionGoogle>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionGoogle],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SectionGoogle);
    fixture.detectChanges();
  });

  afterEach(() => {
    // Configuration du bouton Google, chargée quand il s'affiche
    http.match('/api/auth/google/configuration');
    http.verify();
  });

  function etat(lie: boolean, motDePasseDefini = true) {
    http.expectOne('/api/auth/google/liaison').flush({ lie, emailGoogle: lie ? 'awa.perso@gmail.com' : null, motDePasseDefini });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function bouton(racine: HTMLElement, texte: string) {
    return [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  }

  it('propose le bouton Google quand aucun compte n’est lié', () => {
    const racine = etat(false);
    expect(racine.textContent).toContain('Liez un compte Google');
    expect(racine.querySelector('app-bouton-google')).not.toBeNull();
  });

  it('lie le compte Google choisi puis affiche son adresse', () => {
    etat(false);
    fixture.componentInstance['lier']('jeton-google');
    const requete = http.expectOne((r) => r.method === 'POST' && r.url === '/api/auth/google/liaison');
    expect(requete.request.body).toEqual({ credential: 'jeton-google' });
    requete.flush({ lie: true, emailGoogle: 'awa.perso@gmail.com', motDePasseDefini: true });
    fixture.detectChanges();

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.textContent).toContain('awa.perso@gmail.com');
    expect(racine.querySelector('.message.succes')?.textContent).toContain('Compte Google lié');
  });

  it('affiche le refus du serveur quand le compte Google est déjà lié ailleurs', () => {
    etat(false);
    fixture.componentInstance['lier']('jeton-google');
    http.expectOne((r) => r.method === 'POST').flush(
      { code: 'ADRESSE_DEJA_LIEE', message: 'Ce compte Google est déjà lié à un autre compte EPT Alumni.' },
      { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.message.erreur')?.textContent)
      .toContain('déjà lié à un autre compte EPT Alumni');
  });

  it('demande confirmation avant de délier', () => {
    const racine = etat(true);
    bouton(racine, 'Délier mon compte Google').click();
    fixture.detectChanges();
    expect(racine.textContent).toContain('Google ne pourra plus ouvrir ce compte');

    bouton(racine, 'Délier').click();
    http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/auth/google/liaison')
      .flush({ lie: false, emailGoogle: null, motDePasseDefini: true });
    fixture.detectChanges();
    expect(racine.querySelector('.message.succes')?.textContent).toContain('Compte Google délié');
    expect(racine.querySelector('app-bouton-google')).not.toBeNull();
  });

  it('ne propose pas de délier sans mot de passe et renvoie vers sa création', () => {
    const racine = etat(true, false);
    expect(bouton(racine, 'Délier mon compte Google')).toBeUndefined();
    expect(racine.querySelector('a[href="/mot-de-passe-oublie"]')?.textContent).toContain('définissez d’abord un mot de passe');
  });
});
