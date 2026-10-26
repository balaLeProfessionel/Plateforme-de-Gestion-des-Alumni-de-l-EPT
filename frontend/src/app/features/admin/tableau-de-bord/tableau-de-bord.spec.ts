import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { TableauDeBordAdmin } from '../../../core/services/models/admin.model';
import { TableauDeBord } from './tableau-de-bord';

describe('TableauDeBord', () => {
  let fixture: ComponentFixture<TableauDeBord>;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-10-25T12:00:00Z'), shouldAdvanceTime: true });
    TestBed.configureTestingModule({
      imports: [TableauDeBord],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TableauDeBord);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  const charger = async (tableau: TableauDeBordAdmin) => {
    http.expectOne('/api/admin/tableau-de-bord').flush(tableau);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('met en avant les inscriptions à examiner, leur ancienneté et les dernières décisions', async () => {
    const racine = await charger(tableau({ inscriptionsEnAttente: 20, plusAncienneInscription: '2026-10-13T09:00:00' }));

    const file = racine.querySelector('a.file') as HTMLAnchorElement;
    expect(file.getAttribute('href')).toBe('/admin/inscriptions');
    expect(file.classList).toContain('urgente');
    expect(file.querySelector('strong')?.textContent).toContain('Inscriptions à examiner');
    expect(file.querySelector('.nombre')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('20 en attente');
    expect(file.querySelector('.nombre')?.textContent).toContain('20');
    expect(file.textContent).toContain('depuis 12 jours');
    expect([...racine.querySelectorAll('.indicateurs strong')].map((n) => n.textContent)).toEqual(['223', '14', '31', '2', '6']);
    expect(racine.querySelector('.indicateurs a')?.getAttribute('href')).toBe('/admin/comptes?statut=ACTIF');
    const decision = racine.querySelector('.decisions li') as HTMLElement;
    expect(decision.textContent).toContain('Compte suspendu');
    expect(decision.querySelector('a')?.getAttribute('href')).toBe('/admin/comptes/c9');
  });

  it('dit quand tout est traité', async () => {
    const racine = await charger({ ...tableau({ inscriptionsEnAttente: 0, plusAncienneInscription: null }), dernieresDecisions: [] });
    expect(racine.querySelector('a.file')?.textContent).toContain('Aucune inscription à examiner');
    expect(racine.querySelector('a.file')?.classList).not.toContain('urgente');
    expect(racine.querySelector('.decisions')).toBeNull();
    expect(racine.textContent).toContain('Aucune décision pour l’instant.');
  });

  it('signale un chargement impossible', async () => {
    http.expectOne('/api/admin/tableau-de-bord').flush({ message: 'Accès refusé' }, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Accès refusé');
  });
});

function tableau(aTraiter: TableauDeBordAdmin['aTraiter']): TableauDeBordAdmin {
  return {
    aTraiter,
    communaute: { comptesActifs: 223, inscritsCeMois: 14, mentoratsEnCours: 31, programmesOuverts: 2, evenementsAVenir: 6 },
    dernieresDecisions: [{
      id: 'a1', type: 'SUSPENSION', motif: 'Spam', details: null, dateAction: '2026-10-24T10:00:00Z', auteur: 'Mame Diarra Ndour',
      cibleId: 'c9', cibleNom: 'Compte Suspendu', cibleRole: 'ALUMNI',
    }],
  };
}
