import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { AuthService } from '../../../core/services/auth/auth-service';
import { NouveauCompte } from './nouveau-compte';

describe('NouveauCompte', () => {
  let fixture: ComponentFixture<NouveauCompte>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NouveauCompte],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi' }) } },
        { provide: CompteurInscriptions, useValue: { actualiser: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NouveauCompte);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const racine = () => fixture.nativeElement as HTMLElement;
  const saisir = (id: string, valeur: string, evenement = 'input') => {
    const champ = racine().querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    if (evenement !== 'input') champ.dispatchEvent(new Event(evenement));
    fixture.detectChanges();
  };
  const soumettre = async () => {
    racine().querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  it('refuse un formulaire incomplet sans rien envoyer et met le focus sur la première erreur', async () => {
    saisir('compte-entree', '24');
    await soumettre();
    http.expectNone('/api/admin/comptes');
    expect([...racine().querySelectorAll('.erreur-champ')].map((e) => e.textContent?.trim())).toEqual([
      'Le prénom est obligatoire.', 'Le nom est obligatoire.', 'L’adresse e-mail est obligatoire.', 'Indiquez une année sur quatre chiffres.',
    ]);
    expect(document.activeElement?.id).toBe('compte-prenom');
  });

  it('crée un alumni avec sa promotion et montre une seule fois le mot de passe provisoire', async () => {
    saisir('compte-prenom', ' Awa ');
    saisir('compte-nom', 'Diop');
    saisir('compte-email', 'awa.diop@ept.sn');
    saisir('compte-role', 'ALUMNI', 'change');
    saisir('compte-entree', '2016');
    saisir('compte-sortie', '2019');
    await soumettre();

    const requete = http.expectOne({ method: 'POST', url: '/api/admin/comptes' });
    expect(requete.request.body).toEqual({
      prenom: 'Awa', nom: 'Diop', email: 'awa.diop@ept.sn', role: 'ALUMNI', filiere: null, anneeEntree: 2016, anneeSortie: 2019,
    });
    requete.flush({ id: 'c1', email: 'awa.diop@ept.sn', nom: 'Diop', prenom: 'Awa', role: 'ALUMNI', motDePasseTemporaire: 'Xy7kP2mQ9rTs' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(racine().querySelector('code')?.textContent).toBe('Xy7kP2mQ9rTs');
    expect(racine().querySelector('a.principal')?.getAttribute('href')).toBe('/admin/comptes/c1');
    (racine().querySelectorAll('.resultat .boutons .bouton')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine().querySelector('code')).toBeNull();
    expect((racine().querySelector('#compte-prenom') as HTMLInputElement).value).toBe('');
  });

  it('n’affiche l’année de sortie que pour un alumni et prévient pour un compte admin', () => {
    expect(racine().querySelector('#compte-sortie')).toBeNull();
    saisir('compte-role', 'ADMIN', 'change');
    expect(racine().querySelector('#aide-role')?.textContent).toContain('toute l’administration');
  });

  it('affiche l’erreur du serveur', async () => {
    saisir('compte-prenom', 'Awa');
    saisir('compte-nom', 'Diop');
    saisir('compte-email', 'awa@ept.sn');
    await soumettre();
    http.expectOne('/api/admin/comptes').flush({ message: 'Cet email est déjà utilisé' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine().querySelector('[role="alert"]')?.textContent).toContain('Cet email est déjà utilisé');
  });
});
