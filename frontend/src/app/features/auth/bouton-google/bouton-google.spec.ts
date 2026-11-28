import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';

import { InscriptionGoogle } from '../../../core/services/auth/inscription-google';
import { BoutonGoogle } from './bouton-google';
import { ChargeurGoogle, IdentiteGoogle, ReponseGoogle } from './chargeur-google';

describe('BoutonGoogle', () => {
  let http: HttpTestingController;
  let rappel: ((reponse: ReponseGoogle) => void) | undefined;
  const identite: IdentiteGoogle = {
    initialize: vi.fn((options) => (rappel = options.callback)),
    renderButton: vi.fn(),
  };
  const charger = vi.fn(() => Promise.resolve(identite));

  async function creer() {
    const fixture = TestBed.createComponent(BoutonGoogle);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    rappel = undefined;
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [BoutonGoogle],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ChargeurGoogle, useValue: { charger } }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("n'affiche rien et ne charge pas Google sans identifiant client", async () => {
    const fixture = await creer();
    http.expectOne('/api/auth/google/configuration').flush({ clientId: null });
    await fixture.whenStable();

    expect(charger).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.emplacement')).toBeNull();
  });

  it('affiche le bouton officiel puis ouvre la session avec le jeton de Google', async () => {
    const fixture = await creer();
    const connecte = vi.fn();
    fixture.componentInstance.connecte.subscribe(connecte);
    http.expectOne('/api/auth/google/configuration').flush({ clientId: 'client.apps.googleusercontent.com' });
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.separateur')?.textContent).toContain('ou');
    expect(identite.initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'client.apps.googleusercontent.com' }));
    expect(identite.renderButton).toHaveBeenCalledWith(
      fixture.nativeElement.querySelector('.emplacement'),
      expect.objectContaining({ text: 'continue_with', locale: 'fr' }),
    );

    rappel?.({ credential: 'jeton-google' });
    const requete = http.expectOne('/api/auth/google');
    expect(requete.request.body).toEqual({ credential: 'jeton-google' });
    requete.flush({ accessToken: 'a', refreshToken: 'r', id: 'id', email: 'awa@example.com', role: 'ALUMNI', doitChangerMotDePasse: false });
    expect(connecte).toHaveBeenCalledWith(expect.objectContaining({ email: 'awa@example.com' }));
  });

  it("retient l'identité Google pour l'inscription quand aucun compte n'utilise l'adresse", async () => {
    const fixture = await creer();
    const erreur = vi.fn();
    const inscription = vi.fn();
    fixture.componentInstance.erreur.subscribe(erreur);
    fixture.componentInstance.inscriptionRequise.subscribe(inscription);
    http.expectOne('/api/auth/google/configuration').flush({ clientId: 'client.apps.googleusercontent.com' });
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    rappel?.({ credential: 'jeton-google' });
    http.expectOne('/api/auth/google').flush(
      { code: 'COMPTE_INCONNU', message: 'Aucun compte.', email: 'awa.diop@gmail.com', prenom: 'Awa', nom: 'Diop' },
      { status: 404, statusText: 'Not Found' },
    );
    expect(inscription).toHaveBeenCalled();
    expect(erreur).not.toHaveBeenCalled();
    expect(TestBed.inject(InscriptionGoogle).enAttente())
      .toEqual({ credential: 'jeton-google', email: 'awa.diop@gmail.com', prenom: 'Awa', nom: 'Diop' });
  });

  it('reste masqué quand la bibliothèque Google ne se charge pas', async () => {
    charger.mockImplementationOnce(() => Promise.reject(new Error('bloqué')));
    const fixture = await creer();
    http.expectOne('/api/auth/google/configuration').flush({ clientId: 'client.apps.googleusercontent.com' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.emplacement')).toBeNull();
  });
});
