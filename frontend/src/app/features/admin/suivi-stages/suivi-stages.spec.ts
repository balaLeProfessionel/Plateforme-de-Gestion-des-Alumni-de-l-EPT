import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { OrganismeSuivi } from '../../../core/services/models/stage.model';
import { SuiviStagesPage } from './suivi-stages';

function unOrganisme(changement: Partial<OrganismeSuivi> = {}): OrganismeSuivi {
  return { organismeId: 'org1', nom: 'Kër Data', logoUrl: null, stagiaires: 3, sansEncadrant: 1, conventionsIncompletes: 2,
    evaluationsARemettre: 0, rapportsAttendus: 1, ...changement };
}

describe('SuiviStagesPage', () => {
  let http: HttpTestingController;

  const afficher = async (requete: Record<string, string>, reponse: OrganismeSuivi[]) => {
    TestBed.configureTestingModule({
      imports: [SuiviStagesPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(requete) } } }],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SuiviStagesPage);
    fixture.detectChanges();
    http.match((r) => r.url.includes('filieres')).forEach((r) => r.flush([]));
    const appel = http.expectOne((r) => r.url === '/api/admin/stages/suivi/organismes');
    appel.flush(reponse);
    await fixture.whenStable();
    return { racine: fixture.nativeElement as HTMLElement, appel };
  };

  afterEach(() => http.verify());

  it('liste les organismes avec ce qui reste à faire et garde les filtres dans le lien', async () => {
    const { racine, appel } = await afficher({ filiere: 'f1', sansEncadrant: 'true' }, [
      unOrganisme(), unOrganisme({ organismeId: null, nom: 'Thiès Digital Lab', stagiaires: 1, sansEncadrant: 0, conventionsIncompletes: 0, rapportsAttendus: 0 }),
    ]);
    expect(appel.request.params.get('filiere')).toBe('f1');
    expect(appel.request.params.get('sansEncadrant')).toBe('true');
    const cartes = racine.querySelectorAll('.organisme');
    expect(cartes).toHaveLength(2);
    expect(cartes[0].querySelector('.pastilles')?.textContent).toContain('2 conventions incomplètes');
    const lien = cartes[0].querySelector('a')!.getAttribute('href')!;
    expect(lien).toContain('organisme=org1');
    expect(lien).toContain('filiere=f1');
    expect(cartes[1].querySelector('a')!.getAttribute('href')).toContain('nom=Thi');
    expect(cartes[1].textContent).toContain('Tout est à jour');
    expect(racine.querySelector('.aide')?.textContent).toContain('2 organismes · 4 stagiaires');
  });

  it('annonce l’absence de stage', async () => {
    const { racine } = await afficher({}, []);
    expect(racine.textContent).toContain('Aucun stage');
  });
});
