import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { compte, pageDe } from '../testing/donnees-admin';
import { PassageClasse } from './passage-classe';

describe('PassageClasse', () => {
  let fixture: ComponentFixture<PassageClasse>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  const afficher = (params: Record<string, string>) => {
    const parametres = new BehaviorSubject(convertToParamMap(params));
    TestBed.configureTestingModule({
      imports: [PassageClasse],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametres, snapshot: { queryParamMap: parametres.value } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(PassageClasse);
    fixture.detectChanges();
  };

  afterEach(() => http.verify());

  const racine = () => fixture.nativeElement as HTMLElement;
  const bouton = (texte: string) => [...racine().querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement;
  const charger = async (classe: string | null) => {
    http.expectOne('/api/admin/comptes/classes').flush([
      { classe: 'DIC1', filiere: 'GIT', nombre: 2 }, { classe: 'DIC3', filiere: 'GIT', nombre: 1 }, { classe: null, filiere: 'GC', nombre: 4 },
    ]);
    const liste = http.expectOne((req) => req.url === '/api/admin/comptes');
    liste.flush(pageDe([
      compte({ id: 'a', prenom: 'Awa', role: 'ETUDIANT', classe: classe as 'DIC1' | null }),
      compte({ id: 'b', prenom: 'Binta', role: 'ETUDIANT', classe: classe as 'DIC1' | null }),
      compte({ id: 's', prenom: 'Sali', role: 'ETUDIANT', statutCompte: 'SUSPENDU' }),
    ]));
    await fixture.whenStable();
    fixture.detectChanges();
    return liste;
  };

  it('propose la classe suivante, laisse décocher un redoublant et fait passer les autres', async () => {
    afficher({ classe: 'DIC1', filiere: 'GIT' });
    const liste = await charger('DIC1');
    expect(liste.request.params.get('classe')).toBe('DIC1');
    expect(liste.request.params.get('filiere')).toBe('GIT');
    expect((racine().querySelector('#passage-groupe') as HTMLSelectElement).value).toBe('DIC1|GIT');
    expect(racine().querySelector('#passage-groupe')?.textContent).toContain('Classe non renseignée · GC (4 étudiants)');
    expect((racine().querySelector('#passage-arrivee') as HTMLSelectElement).value).toBe('DIC2');
    expect(racine().querySelectorAll('.etudiants li')).toHaveLength(2);

    (racine().querySelectorAll<HTMLInputElement>('.etudiants input')[1]).click();
    fixture.detectChanges();
    bouton('Faire passer 1 étudiant en DIC2').click();
    fixture.detectChanges();
    expect(racine().querySelector('.confirmation')?.textContent).toContain('de DIC1 en DIC2');
    bouton('Confirmer').click();
    const requete = http.expectOne({ method: 'POST', url: '/api/admin/comptes/passage-classe' });
    expect(requete.request.body).toEqual({ ids: ['a'], classeDepart: 'DIC1', classeArrivee: 'DIC2' });
    requete.flush({ passes: 1, ignores: [] });
    await fixture.whenStable();
    fixture.detectChanges();
    http.expectOne('/api/admin/comptes/classes').flush([]);
    http.expectOne((req) => req.url === '/api/admin/comptes').flush(pageDe([compte({ id: 'b', prenom: 'Binta', role: 'ETUDIANT', classe: 'DIC1' })]));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine().querySelector('[role="status"]')?.textContent).toContain('1 étudiant est passé en DIC2.');
  });

  it('renvoie vers la diplomation en fin de cycle, sans classe proposée', async () => {
    afficher({ classe: 'DIC3', filiere: 'GIT' });
    await charger('DIC3');
    expect(racine().querySelector('.alerte a')?.getAttribute('href')).toBe('/admin/diplomes');
    expect((racine().querySelector('#passage-arrivee') as HTMLSelectElement).value).toBe('');
    expect(bouton('Faire passer').disabled).toBe(true);
  });

  it('cible les étudiants sans classe et change de groupe par l’URL', async () => {
    afficher({ classe: 'aucune', filiere: 'GC' });
    const liste = await charger(null);
    expect(liste.request.params.get('sansClasse')).toBe('true');
    expect((racine().querySelector('#passage-arrivee') as HTMLSelectElement).value).toBe('');

    const choix = racine().querySelector('#passage-groupe') as HTMLSelectElement;
    choix.value = 'DIC1|GIT';
    choix.dispatchEvent(new Event('change'));
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { classe: 'DIC1', filiere: 'GIT' }, replaceUrl: true }));
  });
});
