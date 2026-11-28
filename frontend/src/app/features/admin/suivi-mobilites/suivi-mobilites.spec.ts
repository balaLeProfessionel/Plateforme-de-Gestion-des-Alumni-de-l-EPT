import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { Mobilite } from '../../../core/services/models/mobilite.model';
import { SuiviMobilites } from './suivi-mobilites';

function uneMobilite(changement: Partial<Mobilite> = {}): Mobilite {
  return {
    id: 'mo1', sens: 'ENTRANTE', statut: 'PROPOSEE', type: 'ECHANGE', anneeUniversitaire: '2027-2028', dateDebut: null, dateFin: null,
    organisme: { id: 'u1', nom: 'Université Laval' }, personne: { id: null, prenom: 'Marie', nom: 'Tremblay', email: null },
    programmeOrigine: 'Génie logiciel', filiereAccueil: 'GIT', filiereAccueilId: 'f1', offre: null, motif: null, creeeLe: '2026-11-01T10:00:00Z',
    ...changement,
  };
}
const page = (contenu: Mobilite[]) => ({ contenu, page: 0, taille: 20, totalElements: contenu.length, totalPages: 1 });

describe('SuiviMobilites', () => {
  let fixture: ComponentFixture<SuiviMobilites>;
  let http: HttpTestingController;

  const demarrer = (params: Record<string, string>, mobilites: Mobilite[]) => {
    TestBed.configureTestingModule({
      imports: [SuiviMobilites],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: new BehaviorSubject(convertToParamMap(params)) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SuiviMobilites);
    fixture.detectChanges();
    const requete = http.expectOne((r) => r.url === '/api/admin/mobilites/mobilites');
    requete.flush(page(mobilites));
    fixture.detectChanges();
    return { racine: fixture.nativeElement as HTMLElement, params: requete.request.params };
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('lit les filtres dans l’URL et refuse une proposition seulement avec un motif', () => {
    const { racine, params } = demarrer({ sens: 'ENTRANTE', statut: 'PROPOSEE', organisme: 'u1' }, [uneMobilite()]);
    expect(params.get('sens')).toBe('ENTRANTE');
    expect(params.get('statut')).toBe('PROPOSEE');
    expect(params.get('organisme')).toBe('u1');

    bouton(racine, 'Refuser…').click();
    fixture.detectChanges();
    bouton(racine, 'Refuser la proposition').click();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Le motif est obligatoire.');
    const motif = racine.querySelector('textarea') as HTMLTextAreaElement;
    motif.value = 'Filière complète';
    motif.dispatchEvent(new Event('input'));
    bouton(racine, 'Refuser la proposition').click();
    const refus = http.expectOne('/api/admin/mobilites/mobilites/mo1/refuser');
    expect(refus.request.body).toEqual({ motif: 'Filière complète' });
    refus.flush(uneMobilite({ statut: 'REFUSEE' }));
    http.expectOne((r) => r.url === '/api/admin/mobilites/mobilites').flush(page([uneMobilite({ statut: 'REFUSEE' })]));
    fixture.detectChanges();
    expect(racine.querySelector('.message')?.textContent).toContain('est refusée');
  });

  it('ne propose que les statuts suivants permis, et demande un motif pour annuler', () => {
    const { racine } = demarrer({}, [uneMobilite({ sens: 'SORTANTE', statut: 'PREVUE' })]);
    const choix = racine.querySelector('#statut-mo1') as HTMLSelectElement;
    expect([...choix.options].map((o) => o.value)).toEqual(['', 'EN_COURS', 'ANNULEE']);
    choix.value = 'EN_COURS';
    choix.dispatchEvent(new Event('change'));
    http.expectOne('/api/admin/mobilites/mobilites/mo1/statut').flush(uneMobilite({ statut: 'EN_COURS' }));
    http.expectOne((r) => r.url === '/api/admin/mobilites/mobilites').flush(page([uneMobilite({ sens: 'SORTANTE', statut: 'EN_COURS' })]));
    fixture.detectChanges();

    const suite = racine.querySelector('#statut-mo1') as HTMLSelectElement;
    suite.value = 'ANNULEE';
    suite.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(bouton(racine, 'Annuler la mobilité')).toBeDefined();
    http.expectNone('/api/admin/mobilites/mobilites/mo1/statut');
  });
});
