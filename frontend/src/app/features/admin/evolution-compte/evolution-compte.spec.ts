import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteAdmin } from '../../../core/services/models/admin.model';
import { authAdmin, compte } from '../testing/donnees-admin';
import { EvolutionCompte } from './evolution-compte';

describe('EvolutionCompte', () => {
  let fixture: ComponentFixture<EvolutionCompte>;
  let http: HttpTestingController;
  let messages: string[];

  function demarrer(c: CompteAdmin, auth = authAdmin()): void {
    TestBed.configureTestingModule({
      imports: [EvolutionCompte],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: auth }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EvolutionCompte);
    fixture.componentRef.setInput('compte', c);
    messages = [];
    fixture.componentInstance.modifie.subscribe((message) => messages.push(message));
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  const racine = () => fixture.nativeElement as HTMLElement;
  const bouton = (texte: string) => [...racine().querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement;
  const saisir = (id: string, valeur: string, evenement = 'input') => {
    const champ = racine().querySelector(`#${id}`) as HTMLInputElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    if (evenement !== 'input') champ.dispatchEvent(new Event(evenement));
    fixture.detectChanges();
  };

  it('ne propose le rôle Administration, ni le changement de rôle d’un administrateur, qu’au super administrateur', () => {
    const ordinaire = authAdmin(['CONSULTER_TABLEAU_DE_BORD', 'GERER_COMPTES']);
    demarrer(compte({ role: 'PERSONNEL' }), ordinaire);
    bouton('Changer le rôle').click();
    fixture.detectChanges();
    expect([...racine().querySelectorAll('#evolution-role option')].map((o) => o.textContent)).not.toContain('Administrateur');

    TestBed.resetTestingModule();
    demarrer(compte({ role: 'ADMIN' }), ordinaire);
    expect(racine().querySelector('#titre-evolution')).toBeNull();
  });

  it('change le rôle avec un motif obligatoire, sans proposer le rôle actuel', async () => {
    demarrer(compte({ role: 'PERSONNEL' }));
    bouton('Changer le rôle').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement?.id).toBe('evolution-role');
    expect([...racine().querySelectorAll('#evolution-role option')].map((o) => o.textContent)).not.toContain('Personnel EPT');

    bouton('Changer le rôle').click();
    fixture.detectChanges();
    http.expectNone('/api/admin/comptes/c1/role');
    expect(racine().querySelector('.erreur-champ')?.textContent).toContain('Choisissez le nouveau rôle.');

    saisir('evolution-role', 'ADMIN', 'change');
    expect(racine().textContent).toContain('Ce compte entrera dans l’administration');
    expect(racine().querySelector('#evolution-role')?.getAttribute('aria-describedby')).toBe('alerte-evolution-role');
    saisir('evolution-motif', 'Rejoint le service alumni');

    // Le rôle le plus élevé demande une confirmation qui nomme la personne et ses droits.
    bouton('Changer le rôle').click();
    fixture.detectChanges();
    await fixture.whenStable();
    http.expectNone('/api/admin/comptes/c1/role');
    expect(racine().querySelector('.question')?.textContent).toContain('Donner le rôle Administrateur à Awa Diop ?');
    expect(racine().querySelector('.confirmation')?.textContent).toContain('sans autre responsabilité tant que vous');
    expect(document.activeElement).toBe(bouton('Donner le rôle Administrateur'));

    bouton('Donner le rôle Administrateur').click();
    const requete = http.expectOne({ method: 'PATCH', url: '/api/admin/comptes/c1/role' });
    expect(requete.request.body).toEqual({ role: 'ADMIN', motif: 'Rejoint le service alumni' });
    requete.flush(compte({ role: 'ADMIN' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(messages).toEqual(['Awa Diop a désormais le rôle « Administrateur ».']);
    expect(document.activeElement?.getAttribute('data-action')).toBe('role');
  });

  it('ne propose pas le rôle Administration à une inscription non validée', async () => {
    demarrer(compte({ role: 'ALUMNI', statutCompte: 'EN_ATTENTE' }));
    bouton('Changer le rôle').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect([...racine().querySelectorAll('#evolution-role option')].map((o) => o.textContent)).not.toContain('Administrateur');
    expect(racine().querySelector('#alerte-evolution-role')?.textContent).toContain('une fois l’inscription validée');
  });

  it('rend le focus au bouton d’ouverture quand on annule, y compris avec Échap', async () => {
    demarrer(compte({ role: 'PERSONNEL' }));
    bouton('Changer le rôle').click();
    fixture.detectChanges();
    await fixture.whenStable();
    bouton('Annuler').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement?.getAttribute('data-action')).toBe('role');

    bouton('Changer le rôle').click();
    fixture.detectChanges();
    await fixture.whenStable();
    racine().querySelector('.panneau')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(racine().querySelector('.panneau')).toBeNull();
    expect(document.activeElement?.getAttribute('data-action')).toBe('role');
  });

  it('marque diplômé un étudiant et remonte la raison d’un refus', async () => {
    demarrer(compte({ role: 'ETUDIANT', anneeEntree: 2023 }));
    bouton('Marquer diplômé').click();
    fixture.detectChanges();
    saisir('evolution-sortie', '2022');
    bouton('Marquer diplômé').click();
    fixture.detectChanges();
    http.expectNone('/api/admin/comptes/diplomation');
    expect(racine().querySelector('.erreur-champ')?.textContent).toContain('ne peut pas précéder');

    saisir('evolution-sortie', '2026');
    bouton('Marquer diplômé').click();
    const requete = http.expectOne('/api/admin/comptes/diplomation');
    expect(requete.request.body).toEqual({ ids: ['c1'], anneeSortie: 2026 });
    requete.flush({ diplomes: 1, ignores: [] });
    await fixture.whenStable();
    expect(messages).toEqual(['Awa Diop est désormais alumni (promotion 2026).']);
  });

  it('ne propose rien pour soi-même, un organisme ou un compte suspendu', () => {
    demarrer(compte({ id: 'moi', role: 'ADMIN' }));
    expect(racine().querySelector('section')).toBeNull();
    fixture.componentRef.setInput('compte', compte({ role: 'ORGANISME' }));
    fixture.detectChanges();
    expect(racine().querySelector('section')).toBeNull();
    fixture.componentRef.setInput('compte', compte({ statutCompte: 'SUSPENDU' }));
    fixture.detectChanges();
    expect(racine().querySelector('section')).toBeNull();
  });
});
