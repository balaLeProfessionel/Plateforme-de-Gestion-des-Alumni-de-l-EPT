import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteAdmin } from '../../../core/services/models/admin.model';
import { compte, pageDe } from '../testing/donnees-admin';
import { DELAI_ANNULATION_MS, ListeComptes } from './liste-comptes';

describe('ListeComptes', () => {
  let fixture: ComponentFixture<ListeComptes>;
  let http: HttpTestingController;
  const actualiser = vi.fn();

  const awa = compte({ id: 'a', prenom: 'Awa', statutCompte: 'EN_ATTENTE' });
  const binta = compte({ id: 'b', prenom: 'Binta', statutCompte: 'EN_ATTENTE' });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // jsdom n’implémente pas le défilement.
    Element.prototype.scrollIntoView = vi.fn();
    actualiser.mockClear();
    TestBed.configureTestingModule({
      imports: [ListeComptes],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CompteurInscriptions, useValue: { actualiser } },
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi' }), getToken: () => 'jeton' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ListeComptes);
    fixture.componentRef.setInput('criteres', { recherche: '', role: null, statut: 'EN_ATTENTE' });
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  const racine = () => fixture.nativeElement as HTMLElement;
  const noms = () => [...racine().querySelectorAll('app-ligne-compte h3')].map((titre) => titre.textContent?.trim());
  const charger = async (contenu: CompteAdmin[], numero = 0, totalPages = 1) => {
    // La requête part au cycle de détection suivant le changement de critères ou de version.
    fixture.detectChanges();
    await fixture.whenStable();
    const requete = http.expectOne((req) => req.url === '/api/admin/comptes');
    requete.flush(pageDe(contenu, numero, totalPages));
    await fixture.whenStable();
    fixture.detectChanges();
    return requete;
  };
  const valider = (index: number) => {
    (racine().querySelectorAll('app-ligne-compte')[index].querySelector('[data-action="valider"]') as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  it('laisse quelques secondes pour annuler une validation, puis rend la ligne avec le focus', async () => {
    const requete = await charger([awa, binta]);
    expect(requete.request.params.get('statut')).toBe('EN_ATTENTE');

    valider(0);
    await fixture.whenStable();
    expect(noms()).toEqual(['Binta Diop']);
    expect(racine().querySelector('.annonce')?.textContent).toContain('Inscription de Awa Diop validée.');
    // Le focus passe à la ligne suivante pour enchaîner.
    expect(document.activeElement?.getAttribute('aria-labelledby')).toBe('nom-b');

    (racine().querySelector('.annonce button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    vi.advanceTimersByTime(DELAI_ANNULATION_MS);

    http.expectNone('/api/admin/comptes/a/valider');
    expect(noms()).toEqual(['Awa Diop', 'Binta Diop']);
    expect(racine().querySelector('.annonce')?.textContent).toContain('Validation de Awa Diop annulée.');
    expect(document.activeElement?.getAttribute('aria-labelledby')).toBe('nom-a');
  });

  it('envoie la validation en sursis si l’onglet se ferme pendant le délai', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal('fetch', fetch);
    await charger([awa, binta]);
    valider(0);

    window.dispatchEvent(new Event('pagehide'));
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toBe('/api/admin/comptes/a/valider');
    expect(fetch.mock.calls[0][1]).toEqual(expect.objectContaining({
      method: 'PATCH', keepalive: true, headers: { Authorization: 'Bearer jeton' },
    }));
    vi.advanceTimersByTime(DELAI_ANNULATION_MS);
    http.expectNone('/api/admin/comptes/a/valider');
    vi.unstubAllGlobals();
  });

  it('envoie la validation après le délai, recharge la liste et les compteurs', async () => {
    await charger([awa, binta]);
    valider(0);
    expect(racine().querySelector('.resume')?.textContent).toContain('1');

    vi.advanceTimersByTime(DELAI_ANNULATION_MS);
    http.expectOne({ method: 'PATCH', url: '/api/admin/comptes/a/valider' }).flush(compte({ id: 'a', statutCompte: 'ACTIF' }));
    await charger([binta]);

    expect(actualiser).toHaveBeenCalledOnce();
    expect(noms()).toEqual(['Binta Diop']);
    expect(racine().querySelector('.annonce button')).toBeNull();
  });

  it('envoie tout de suite la validation précédente quand on en valide une autre', async () => {
    await charger([awa, binta]);
    valider(0);
    valider(0);

    http.expectOne('/api/admin/comptes/a/valider').flush(compte({ id: 'a' }));
    await charger([binta]);
    expect(racine().querySelector('.annonce')?.textContent).toContain('Inscription de Binta Diop validée.');

    vi.advanceTimersByTime(DELAI_ANNULATION_MS);
    http.expectOne('/api/admin/comptes/b/valider').flush(compte({ id: 'b' }));
    await charger([]);
    expect(racine().querySelector('.etat h2')?.textContent).toContain('Aucun compte');
  });

  it('remet la ligne et prévient si la validation échoue', async () => {
    await charger([awa]);
    valider(0);
    vi.advanceTimersByTime(DELAI_ANNULATION_MS);
    http.expectOne('/api/admin/comptes/a/valider')
      .flush({ message: 'Cette inscription a déjà été traitée : impossible de la valider.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(noms()).toEqual(['Awa Diop']);
    expect(racine().querySelector('.annonce .erreur')?.textContent).toContain('déjà été traitée');
  });

  it('change de page en prévenant la page parente et place le focus sur le résumé', async () => {
    const pages: number[] = [];
    fixture.componentInstance.page.subscribe((numero) => pages.push(numero));
    await charger([awa], 0, 3);
    expect(racine().querySelector('.resume')?.textContent).toContain('page 1 sur 3');

    (racine().querySelector('.pagination button:last-child') as HTMLButtonElement).click();
    fixture.detectChanges();
    const requete = await charger([binta], 1, 3);

    expect(pages).toEqual([1]);
    expect(requete.request.params.get('page')).toBe('1');
    expect(document.activeElement?.classList.contains('resume')).toBe(true);
  });
});
