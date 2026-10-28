import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { AuthService } from '../../../core/services/auth/auth-service';
import { ImportComptes } from './import-comptes';

describe('ImportComptes', () => {
  let fixture: ComponentFixture<ImportComptes>;
  let http: HttpTestingController;
  const actualiser = vi.fn();

  beforeEach(() => {
    actualiser.mockClear();
    TestBed.configureTestingModule({
      imports: [ImportComptes],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: CompteurInscriptions, useValue: { actualiser } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ImportComptes);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('montre un aperçu, envoie toutes les lignes et rend le rapport ligne par ligne', async () => {
    const racine = fixture.nativeElement as HTMLElement;
    const zone = racine.querySelector('#import-texte') as HTMLTextAreaElement;
    zone.value = 'prenom;nom;email;filiere;annee_entree\nAwa;Diop;awa@ept.sn;GIT;2026\nBinta;Sow;pas-une-adresse;GIT;2026';
    zone.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(racine.querySelector('[role="status"]')?.textContent).toContain('2 lignes lues');
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('1 à corriger');
    expect([...racine.querySelectorAll('tbody tr')].map((tr) => tr.classList.contains('echec'))).toEqual([false, true]);
    const bouton = [...racine.querySelectorAll('button')].find((b) => b.textContent?.includes('Créer')) as HTMLButtonElement;
    expect(bouton.textContent).toContain('Créer 1 compte (Étudiant)');

    bouton.click();
    const requete = http.expectOne({ method: 'POST', url: '/api/admin/comptes/import' });
    expect(requete.request.body.role).toBe('ETUDIANT');
    expect(requete.request.body.lignes).toEqual([
      { prenom: 'Awa', nom: 'Diop', email: 'awa@ept.sn', filiere: 'GIT', anneeEntree: 2026, anneeSortie: null },
      { prenom: 'Binta', nom: 'Sow', email: 'pas-une-adresse', filiere: 'GIT', anneeEntree: 2026, anneeSortie: null },
    ]);
    requete.flush({ crees: 1, lignes: [
      { numero: 1, email: 'awa@ept.sn', creee: true, message: null, id: 'c1', motDePasseTemporaire: 'Mdp1' },
      { numero: 2, email: 'pas-une-adresse', creee: false, message: 'Format d\'email invalide', id: null, motDePasseTemporaire: null },
    ] });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(actualiser).toHaveBeenCalledOnce();
    expect(racine.querySelector('.message')?.textContent).toContain('1 compte créé sur 2');
    const lignes = [...racine.querySelectorAll('tbody tr')] as HTMLElement[];
    expect(lignes[0].querySelector('a')?.getAttribute('href')).toBe('/admin/comptes/c1');
    expect(lignes[1].textContent).toContain('Format d\'email invalide');
    expect(racine.textContent).toContain('Télécharger les mots de passe provisoires');
  });

  it('signale un fichier sans les colonnes obligatoires', () => {
    const racine = fixture.nativeElement as HTMLElement;
    const zone = racine.querySelector('#import-texte') as HTMLTextAreaElement;
    zone.value = 'prenom;filiere\nAwa;GIT';
    zone.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Colonnes obligatoires absentes');
    expect([...racine.querySelectorAll('button')].some((b) => b.textContent?.includes('Créer'))).toBe(false);
  });
});
