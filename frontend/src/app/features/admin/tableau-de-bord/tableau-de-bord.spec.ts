import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { TableauDeBordAdmin } from '../../../core/services/models/admin.model';
import { authAdmin } from '../testing/donnees-admin';
import { TableauDeBord } from './tableau-de-bord';

describe('TableauDeBord', () => {
  let fixture: ComponentFixture<TableauDeBord>;
  let http: HttpTestingController;

  const preparer = (auth = authAdmin()) => {
    TestBed.configureTestingModule({
      imports: [TableauDeBord],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TableauDeBord);
    fixture.detectChanges();
  };

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-10-25T12:00:00Z'), shouldAdvanceTime: true });
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
    preparer();
    const racine = await charger(tableau({ inscriptionsEnAttente: 20, plusAncienneInscription: '2026-10-13T09:00:00', superAdministrateursActifs: 2 }));

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

  it('dit quand rien n’attend, sans prétendre que des inscriptions ont été traitées', async () => {
    preparer();
    const racine = await charger({ ...tableau({ inscriptionsEnAttente: 0, plusAncienneInscription: null, superAdministrateursActifs: 2 }), dernieresDecisions: [] });
    expect(racine.querySelector('a.file')?.textContent).toContain('Aucune inscription à examiner');
    expect(racine.textContent).not.toContain('ont été traitées');
    expect(racine.querySelector('.seul-admin')).toBeNull();
    expect(racine.querySelector('a.file')?.classList).not.toContain('urgente');
    expect(racine.querySelector('.decisions')).toBeNull();
    expect(racine.textContent).toContain('Aucune décision pour l’instant.');
  });

  it('demande un second super administrateur tant qu’il n’y en a qu’un', async () => {
    preparer();
    const racine = await charger(tableau({ inscriptionsEnAttente: 0, plusAncienneInscription: null, superAdministrateursActifs: 1 }));
    const alerte = racine.querySelector('a.seul-admin') as HTMLAnchorElement;
    expect(alerte.textContent).toContain('Un seul super administrateur');
    expect(alerte.getAttribute('href')).toBe('/admin/comptes/nouveau?role=ADMIN');
  });

  it('ne montre pas cette alerte à un administrateur qui ne peut pas nommer de super administrateur', async () => {
    preparer(authAdmin(['CONSULTER_TABLEAU_DE_BORD', 'GERER_COMPTES']));
    const racine = await charger(tableau({ inscriptionsEnAttente: 0, plusAncienneInscription: null, superAdministrateursActifs: 1 }));
    expect(racine.querySelector('.seul-admin')).toBeNull();
  });

  it('signale un chargement impossible', async () => {
    preparer();
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
