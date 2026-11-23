import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { compte } from '../testing/donnees-admin';
import { ClasseCompte } from './classe-compte';

describe('ClasseCompte', () => {
  let fixture: ComponentFixture<ClasseCompte>;
  let http: HttpTestingController;

  const afficher = (classe: 'DIC1' | null) => {
    TestBed.configureTestingModule({ imports: [ClasseCompte], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ClasseCompte);
    fixture.componentRef.setInput('compte', compte({ role: 'ETUDIANT', classe }));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('montre la classe et l’enregistre après modification', () => {
    const racine = afficher('DIC1');
    const modifie = vi.fn();
    fixture.componentInstance.modifie.subscribe(modifie);
    expect(racine.querySelector('dd')?.textContent).toContain('DIC1');

    bouton(racine, 'Modifier').click();
    fixture.detectChanges();
    const liste = racine.querySelector('#classe-compte') as HTMLSelectElement;
    expect(liste.value).toBe('DIC1');
    liste.value = 'DIC2';
    liste.dispatchEvent(new Event('change'));
    bouton(racine, 'Enregistrer').click();
    const requete = http.expectOne({ method: 'PATCH', url: '/api/admin/comptes/c1/classe' });
    expect(requete.request.body).toEqual({ classe: 'DIC2' });
    requete.flush(compte({ role: 'ETUDIANT', classe: 'DIC2' }));
    fixture.detectChanges();
    expect(modifie).toHaveBeenCalledWith('Awa Diop est désormais en DIC2.');
    expect(racine.querySelector('#classe-compte')).toBeNull();
  });

  it('signale une classe non renseignée et exige un choix', () => {
    const racine = afficher(null);
    expect(racine.querySelector('dd')?.textContent).toContain('Non renseignée');
    bouton(racine, 'Modifier').click();
    fixture.detectChanges();
    bouton(racine, 'Enregistrer').click();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Choisissez la classe.');
  });
});
