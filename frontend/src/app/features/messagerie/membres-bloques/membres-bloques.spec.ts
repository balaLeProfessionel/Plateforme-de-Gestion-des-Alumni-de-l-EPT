import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { MembreBloque } from '../../../core/services/models/messagerie.model';
import { EtatConversations } from '../etat-conversations';
import { MembresBloques } from './membres-bloques';

registerLocaleData(localeFr);

const bloque = (id: string, prenom: string): MembreBloque => ({
  id, prenom, nom: 'Diop', nomAffiche: `${prenom} Diop`, urlPhoto: null, role: 'ALUMNI', bloqueLe: '2026-11-14T09:00:00Z',
});

describe('MembresBloques', () => {
  let fixture: ComponentFixture<MembresBloques>;
  let http: HttpTestingController;
  const etat = { actualiser: vi.fn() };

  beforeEach(async () => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
    etat.actualiser.mockClear();
    await TestBed.configureTestingModule({
      imports: [MembresBloques],
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: EtatConversations, useValue: etat },
        { provide: LOCALE_ID, useValue: 'fr' },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MembresBloques);
  });

  afterEach(() => http.verify());

  /** Laisse finir la requête simulée, puis met la vue à jour. */
  async function stabiliser(): Promise<void> {
    await new Promise((fin) => setTimeout(fin));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function ouvrir(membres: MembreBloque[]): Promise<HTMLElement> {
    fixture.componentRef.setInput('ouverte', true);
    fixture.detectChanges();
    http.expectOne('/api/messagerie/blocages').flush(membres);
    await stabiliser();
    return fixture.nativeElement as HTMLElement;
  }

  it('dit quand personne n’est bloqué', async () => {
    const racine = await ouvrir([]);
    expect(racine.querySelector('.etat.vide')?.textContent).toContain('Vous n’avez bloqué personne.');
  });

  it('débloque un membre, le retire de la liste et rend le focus au suivant', async () => {
    const racine = await ouvrir([bloque('u-1', 'Awa'), bloque('u-2', 'Moussa')]);
    document.body.appendChild(racine);
    try {
      expect(racine.querySelector('.membres li small')?.textContent).toContain('Depuis le 14 novembre 2026');
      racine.querySelector<HTMLButtonElement>('[aria-label="Débloquer Awa Diop"]')?.click();

      const requete = http.expectOne('/api/messagerie/blocages/u-1');
      expect(requete.request.method).toBe('DELETE');
      requete.flush(null);
      await stabiliser();

      expect([...racine.querySelectorAll('.membres strong')].map((n) => n.textContent)).toEqual(['Moussa Diop']);
      expect(racine.querySelector('[role="status"]')?.textContent).toContain('Vous avez débloqué Awa Diop');
      expect(etat.actualiser).toHaveBeenCalled();
      await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('Débloquer Moussa Diop'));
    } finally {
      racine.remove();
    }
  });

  it('propose de réessayer si la liste ne se charge pas', async () => {
    fixture.componentRef.setInput('ouverte', true);
    fixture.detectChanges();
    http.expectOne('/api/messagerie/blocages').flush({ message: 'Erreur' }, { status: 500, statusText: 'Erreur' });
    await stabiliser();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger les membres bloqués');
    racine.querySelector<HTMLButtonElement>('[role="alert"] button')?.click();
    http.expectOne('/api/messagerie/blocages').flush([]);
  });
});
