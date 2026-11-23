import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SollicitationsPage } from './sollicitations';

const API = '/api/admin/stages/sollicitations';

describe('SollicitationsPage', () => {
  let fixture: ComponentFixture<SollicitationsPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [SollicitationsPage], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SollicitationsPage);
    fixture.detectChanges();
    http.expectOne(`${API}/destinataires`).flush([
      { organismeId: 'a', nom: 'Kër Data', email: 'rh@kerdata.sn' },
      { organismeId: 'b', nom: 'Sonatel', email: 'stages@sonatel.sn' },
    ]);
    http.expectOne((r) => r.url === `${API}/modele`).flush({ objet: 'Sujets de PFE', message: 'Madame, Monsieur' });
    http.expectOne((r) => r.url === API && r.method === 'GET').flush({ contenu: [], page: 0, taille: 10, totalElements: 0, totalPages: 0 });
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const element = () => fixture.nativeElement as HTMLElement;
  const bouton = (texte: string) => [...element().querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

  it('envoie le message prérempli aux organismes restés cochés, après confirmation', async () => {
    expect(element().querySelector<HTMLInputElement>('#objet')!.value).toBe('Sujets de PFE');
    const cases = element().querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    cases[1].checked = false;
    cases[1].dispatchEvent(new Event('change'));
    bouton('Envoyer').click();
    await fixture.whenStable();
    expect(element().querySelector('.confirmation')?.textContent).toContain('1 organisme');
    bouton('Confirmer l’envoi').click();
    const requete = http.expectOne((r) => r.url === API && r.method === 'POST');
    expect(requete.request.body.organismeIds).toEqual(['a']);
    requete.flush({ id: 's1', type: 'SUJETS_PFE', objet: 'Sujets de PFE', message: 'Madame', nombreDestinataires: 1, destinataires: [],
      envoyeePar: 'Awa Ndiaye', envoyeeLe: '2026-10-05T09:00:00Z' });
    http.expectOne((r) => r.url === API && r.method === 'GET').flush({ contenu: [], page: 0, taille: 10, totalElements: 0, totalPages: 0 });
    await fixture.whenStable();
    expect(element().querySelector('[role="status"]')?.textContent).toContain('Message envoyé à 1 organisme.');
  });

  it('refuse un envoi sans destinataire', async () => {
    bouton('Tout décocher').click();
    bouton('Envoyer').click();
    await fixture.whenStable();
    expect(element().querySelector('[role="alert"]')?.textContent).toContain('au moins un organisme');
  });
});
