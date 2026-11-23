import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Convention } from '../../../core/services/models/partenariat.model';
import { MesConventions } from './mes-conventions';

export function uneConvention(changement: Partial<Convention> = {}): Convention {
  return {
    id: 'c1', organismeId: 'o1', organismeNom: 'Sonatel', organismeLogoUrl: null, objet: 'Coopération en formation', domaines: 'Stages',
    message: 'Nous souhaitons accueillir des étudiants.', statut: 'DEMANDEE', origine: 'ORGANISME', dateSignature: null, dateDebut: null,
    dateFin: null, joursRestants: null, expireBientot: false, motifDecision: null, creeeLe: '2026-11-01T10:00:00Z',
    modifieeLe: '2026-11-01T10:00:00Z', pieces: [], ...changement,
  };
}

describe('MesConventions', () => {
  let http: HttpTestingController;

  const afficher = (conventions: Convention[]) => {
    TestBed.configureTestingModule({
      imports: [MesConventions],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MesConventions);
    fixture.detectChanges();
    http.expectOne('/api/partenariats/conventions').flush(conventions);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => http.verify());

  it('invite à demander une convention tant qu’aucune demande n’est en cours', () => {
    const racine = afficher([]);
    expect(racine.querySelector('a[href="/partenariats/demander"]')).not.toBeNull();
    expect(racine.textContent).toContain('Aucune convention pour l’instant');
  });

  it('masque la demande pendant le traitement et signale la convention qui expire', () => {
    const racine = afficher([
      uneConvention(),
      uneConvention({ id: 'c2', statut: 'ACTIVE', dateDebut: '2025-01-01', dateFin: '2026-12-20', joursRestants: 27, expireBientot: true }),
    ]);
    expect(racine.querySelector('a[href="/partenariats/demander"]')).toBeNull();
    expect(racine.textContent).toContain('Votre organisme est partenaire de l’EPT.');
    expect(racine.textContent).toContain('Prend fin dans 27 jours.');
    expect(racine.querySelector('a[href="/partenariats/conventions/c2"]')).not.toBeNull();
  });
});
