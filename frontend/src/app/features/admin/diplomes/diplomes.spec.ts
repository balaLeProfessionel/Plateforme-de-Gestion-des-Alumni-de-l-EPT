import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { compte, pageDe } from '../testing/donnees-admin';
import { Diplomes } from './diplomes';

describe('Diplomes', () => {
  let fixture: ComponentFixture<Diplomes>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const parametres = new BehaviorSubject(convertToParamMap({ entree: '2023', filiere: 'GIT' }));
    TestBed.configureTestingModule({
      imports: [Diplomes],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametres, snapshot: { queryParamMap: parametres.value } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(Diplomes);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const racine = () => fixture.nativeElement as HTMLElement;
  const charger = async () => {
    http.expectOne('/api/admin/comptes/promotions').flush([
      { anneeEntree: 2023, filiere: 'GIT', nombre: 2 }, { anneeEntree: 2024, filiere: 'GC', nombre: 5 },
    ]);
    const liste = http.expectOne((req) => req.url === '/api/admin/comptes');
    liste.flush(pageDe([
      compte({ id: 'a', prenom: 'Awa', role: 'ETUDIANT', anneeEntree: 2023 }),
      compte({ id: 'b', prenom: 'Binta', role: 'ETUDIANT', anneeEntree: 2023 }),
      compte({ id: 's', prenom: 'Sali', role: 'ETUDIANT', statutCompte: 'SUSPENDU' }),
    ]));
    await fixture.whenStable();
    fixture.detectChanges();
    return liste;
  };

  it('liste les étudiants de la promotion choisie, tous cochés, sans les comptes suspendus', async () => {
    const liste = await charger();
    expect(liste.request.params.get('role')).toBe('ETUDIANT');
    expect(liste.request.params.get('anneeEntree')).toBe('2023');
    expect(liste.request.params.get('filiere')).toBe('GIT');
    expect((racine().querySelector('#diplomes-promotion') as HTMLSelectElement).value).toBe('2023|GIT');
    expect([...racine().querySelectorAll('.etudiants label')].map((l) => l.textContent?.trim())).toEqual(['Awa Diop', 'Binta Diop']);
    expect([...racine().querySelectorAll<HTMLInputElement>('.etudiants input')].every((c) => c.checked)).toBe(true);

    const choix = racine().querySelector('#diplomes-promotion') as HTMLSelectElement;
    choix.value = '2024|GC';
    choix.dispatchEvent(new Event('change'));
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: { entree: '2024', filiere: 'GC' } }));
  });

  it('garde sélectionnable une promotion dont l’année d’entrée est inconnue', async () => {
    await charger();
    const choix = racine().querySelector('#diplomes-promotion') as HTMLSelectElement;
    http.expectNone('/api/admin/comptes/promotions');
    fixture.componentInstance['promotions'].set([{ anneeEntree: null, filiere: 'GIT', nombre: 3 }]);
    fixture.detectChanges();
    choix.value = '|GIT';
    choix.dispatchEvent(new Event('change'));
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: { entree: 'inconnue', filiere: 'GIT' } }));
  });

  it('demande confirmation puis marque diplômés les étudiants cochés', async () => {
    await charger();
    (racine().querySelectorAll('.etudiants input')[1] as HTMLInputElement).click();
    fixture.detectChanges();
    const marquer = [...racine().querySelectorAll('button')].find((b) => b.textContent?.includes('Marquer')) as HTMLButtonElement;
    expect(marquer.textContent).toContain('Marquer 1 diplômé');
    marquer.click();
    fixture.detectChanges();
    expect(racine().querySelector('.confirmation')?.textContent).toContain('Marquer 1 étudiant diplômé');

    (racine().querySelector('.confirmation .principal') as HTMLButtonElement).click();
    const requete = http.expectOne('/api/admin/comptes/diplomation');
    expect(requete.request.body).toEqual({ ids: ['a'], anneeSortie: new Date().getFullYear() });
    requete.flush({ diplomes: 1, ignores: [] });
    await fixture.whenStable();
    fixture.detectChanges();

    http.expectOne('/api/admin/comptes/promotions').flush([{ anneeEntree: 2023, filiere: 'GIT', nombre: 1 }]);
    http.expectOne((req) => req.url === '/api/admin/comptes').flush(pageDe([compte({ id: 'b', prenom: 'Binta', role: 'ETUDIANT' })]));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine().querySelector('[role="status"]')?.textContent).toContain('1 étudiant est désormais alumni');
    expect(racine().querySelectorAll('.etudiants li')).toHaveLength(1);
  });
});
