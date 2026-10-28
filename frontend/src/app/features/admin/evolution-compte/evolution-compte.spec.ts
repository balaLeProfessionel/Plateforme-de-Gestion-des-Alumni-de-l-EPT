import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteAdmin } from '../../../core/services/models/admin.model';
import { compte } from '../testing/donnees-admin';
import { EvolutionCompte } from './evolution-compte';

describe('EvolutionCompte', () => {
  let fixture: ComponentFixture<EvolutionCompte>;
  let http: HttpTestingController;
  let messages: string[];

  function demarrer(c: CompteAdmin): void {
    TestBed.configureTestingModule({
      imports: [EvolutionCompte],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi' }) } }],
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
    expect(racine().textContent).toContain('accès à toute l’administration');
    saisir('evolution-motif', 'Rejoint le service alumni');
    bouton('Changer le rôle').click();
    const requete = http.expectOne({ method: 'PATCH', url: '/api/admin/comptes/c1/role' });
    expect(requete.request.body).toEqual({ role: 'ADMIN', motif: 'Rejoint le service alumni' });
    requete.flush(compte({ role: 'ADMIN' }));
    await fixture.whenStable();
    expect(messages).toEqual(['Awa Diop a désormais le rôle « Administration ».']);
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
