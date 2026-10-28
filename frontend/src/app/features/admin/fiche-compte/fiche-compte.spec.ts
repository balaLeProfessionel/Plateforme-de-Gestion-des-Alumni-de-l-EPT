import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { AuthService } from '../../../core/services/auth/auth-service';
import { FicheCompte } from '../../../core/services/models/admin.model';
import { compte } from '../testing/donnees-admin';
import { FicheComptePage } from './fiche-compte';

describe('FicheComptePage', () => {
  let fixture: ComponentFixture<FicheComptePage>;
  let http: HttpTestingController;
  const actualiser = vi.fn();

  beforeEach(() => {
    actualiser.mockClear();
    const params = convertToParamMap({ id: 'c1' });
    TestBed.configureTestingModule({
      imports: [FicheComptePage],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(params), snapshot: { paramMap: params } } },
        { provide: CompteurInscriptions, useValue: { actualiser } },
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FicheComptePage);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const racine = () => fixture.nativeElement as HTMLElement;
  const charger = async (donnees: FicheCompte) => {
    fixture.detectChanges();
    await fixture.whenStable();
    http.expectOne('/api/admin/comptes/c1').flush(donnees);
    await fixture.whenStable();
    fixture.detectChanges();
    http.expectOne('/api/admin/comptes/c1/historique').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('montre tout ce qu’il faut pour décider, champs privés compris', async () => {
    await charger(fiche());

    expect(racine().querySelector('h1')?.textContent).toContain('Awa Diop');
    expect(racine().querySelector('.statut')?.textContent).toContain('En attente');
    const valeurs = Object.fromEntries([...racine().querySelectorAll('dt')]
      .map((dt) => [dt.textContent?.trim(), dt.nextElementSibling?.textContent?.trim()]));
    expect(valeurs['Ville']).toBe('Thiès');
    expect(valeurs['Diplôme']).toBe('Ingénieur');
    expect(valeurs['Téléphone']).toBe('Non renseigné');
    expect(valeurs['Mot de passe']).toBe('Choisi par le membre');
    expect(racine().querySelector('.lien-public')?.getAttribute('href')).toBe('/profil/c1');
  });

  it('valide depuis la fiche, puis recharge la fiche, l’historique et les compteurs', async () => {
    await charger(fiche());
    (racine().querySelector('[data-action="valider"]') as HTMLButtonElement).click();
    http.expectOne({ method: 'PATCH', url: '/api/admin/comptes/c1/valider' }).flush(compte({ statutCompte: 'ACTIF' }));
    await fixture.whenStable();

    await charger({ ...fiche(), compte: compte({ statutCompte: 'ACTIF', nombreDecisions: 1 }) });
    expect(actualiser).toHaveBeenCalledOnce();
    expect(racine().querySelector('[role="status"]')?.textContent).toContain('Inscription de Awa Diop validée.');
    expect(racine().querySelector('.statut')?.textContent).toContain('Actif');
  });

  it('explique une fiche introuvable', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    http.expectOne('/api/admin/comptes/c1').flush({ message: 'Compte introuvable' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine().querySelector('[role="alert"]')?.textContent).toContain('n’existe pas');
    expect(racine().querySelector('[role="alert"] a')?.getAttribute('href')).toBe('/admin/comptes');
  });
});

function fiche(): FicheCompte {
  return {
    compte: compte({ statutCompte: 'EN_ATTENTE' }), villeResidence: 'Thiès', posteActuel: 'Ingénieure réseau',
    lienLinkedin: null, lienPortfolio: null, bio: null, diplome: 'INGENIEUR', dateNaissance: '1998-04-12',
    doitChangerMotDePasse: false, nombreFormations: 1, nombreExperiences: 2,
  };
}
