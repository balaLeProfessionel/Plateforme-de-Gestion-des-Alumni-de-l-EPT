import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteAdmin } from '../../../core/services/models/admin.model';
import { compte } from '../testing/donnees-admin';
import { LigneCompte } from './ligne-compte';

describe('LigneCompte', () => {
  let fixture: ComponentFixture<LigneCompte>;
  let http: HttpTestingController;
  let messages: string[];
  let validations: number;

  function demarrer(compte: CompteAdmin): void {
    TestBed.configureTestingModule({
      imports: [LigneCompte],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LigneCompte);
    fixture.componentRef.setInput('compte', compte);
    messages = [];
    validations = 0;
    fixture.componentInstance.modifie.subscribe((message) => messages.push(message));
    fixture.componentInstance.validationDemandee.subscribe(() => validations++);
    fixture.detectChanges();
  }

  const racine = () => fixture.nativeElement as HTMLElement;
  const boutons = () => [...racine().querySelectorAll('.actions button')] as HTMLButtonElement[];
  const libelles = () => boutons().map((bouton) => bouton.textContent?.replace(/\s+/g, ' ').trim());
  const saisir = (texte: string) => {
    const champ = racine().querySelector('textarea') as HTMLTextAreaElement;
    champ.value = texte;
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  afterEach(() => http.verify());

  it('confie la validation à la liste sans appeler le serveur', () => {
    demarrer(compte({ statutCompte: 'EN_ATTENTE' }));
    expect(libelles()).toEqual(['Valider', 'Refuser']);

    boutons()[0].click();
    expect(validations).toBe(1);
    http.expectNone('/api/admin/comptes/c1/valider');
  });

  it('exige un motif pour refuser, compte les caractères et envoie le motif nettoyé', async () => {
    demarrer(compte({ statutCompte: 'EN_ATTENTE' }));
    boutons()[1].click();
    fixture.detectChanges();
    await fixture.whenStable();

    const champ = racine().querySelector('textarea') as HTMLTextAreaElement;
    expect(document.activeElement).toBe(champ);
    expect(racine().querySelector('.compteur')?.textContent).toContain('0 / 500 caractères');

    boutons()[0].click();
    fixture.detectChanges();
    http.expectNone('/api/admin/comptes/c1/refuser');
    expect(racine().querySelector('.panneau .erreur')?.textContent).toContain('Indiquez le motif.');
    expect(champ.getAttribute('aria-invalid')).toBe('true');

    saisir('  Diplôme introuvable ');
    expect(racine().querySelector('.compteur')?.textContent).toContain('22 / 500 caractères');
    boutons()[0].click();
    const requete = http.expectOne('/api/admin/comptes/c1/refuser');
    expect(requete.request.body).toEqual({ motif: 'Diplôme introuvable' });
    requete.flush(compte({ statutCompte: 'SUSPENDU' }));
    await fixture.whenStable();

    expect(messages).toEqual(['Inscription de Awa Diop refusée.']);
  });

  it('ferme le panneau avec Échap et rend le focus au bouton qui l’a ouvert', async () => {
    demarrer(compte({ statutCompte: 'ACTIF' }));
    boutons()[0].click();
    fixture.detectChanges();
    await fixture.whenStable();

    racine().querySelector('.panneau')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(racine().querySelector('.panneau')).toBeNull();
    expect(document.activeElement?.getAttribute('data-action')).toBe('suspension');
  });

  it('ouvre la fiche d’administration du compte, quel que soit son statut', () => {
    demarrer(compte({ statutCompte: 'EN_ATTENTE' }));
    const lien = () => racine().querySelector('a.voir-fiche');
    expect(lien()?.getAttribute('href')).toBe('/admin/comptes/c1');
    expect(lien()?.textContent).toContain('Ouvrir la fiche');
    expect(lien()?.getAttribute('aria-label')).toBe('Ouvrir la fiche de Awa Diop');

    fixture.componentRef.setInput('compte', compte({ statutCompte: 'SUSPENDU' }));
    fixture.detectChanges();
    expect(lien()?.getAttribute('href')).toBe('/admin/comptes/c1');
  });

  it('affiche un contact d’organisme sans prénom par son seul nom', () => {
    demarrer(compte({ role: 'ORGANISME', prenom: null as unknown as string, nom: 'Agence des infrastructures' }));
    expect(racine().querySelector('h3')?.textContent?.trim()).toBe('Agence des infrastructures');
    expect(racine().querySelector('a.voir-fiche')?.getAttribute('aria-label')).toBe('Ouvrir la fiche de Agence des infrastructures');
  });

  it('ne propose pas de se suspendre soi-même', () => {
    demarrer(compte({ id: 'moi', statutCompte: 'ACTIF', role: 'ADMIN' }));
    expect(libelles()).toEqual([]);
    expect(racine().querySelector('h3')?.textContent).toContain('(vous)');
  });

  it('réactive sans note obligatoire et affiche le motif de la suspension', async () => {
    demarrer(compte({ statutCompte: 'SUSPENDU', motifSuspension: 'Usurpation d’identité', nombreDecisions: 1 }));
    expect(racine().querySelector('.motif')?.textContent).toContain('Usurpation d’identité');

    boutons()[0].click();
    fixture.detectChanges();
    boutons()[0].click();
    const requete = http.expectOne('/api/admin/comptes/c1/reactiver');
    expect(requete.request.body).toEqual({ motif: null });
    requete.flush(compte({ statutCompte: 'ACTIF' }));
    await fixture.whenStable();

    expect(messages).toEqual(['Compte de Awa Diop réactivé.']);
  });

  it('affiche l’erreur du serveur sur la ligne et garde le panneau ouvert', async () => {
    demarrer(compte({ statutCompte: 'ACTIF' }));
    boutons()[0].click();
    fixture.detectChanges();
    saisir('Contenus abusifs');
    boutons()[0].click();
    http.expectOne('/api/admin/comptes/c1/suspendre')
      .flush({ message: 'Ce compte est déjà suspendu.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(racine().querySelector('[role="alert"]')?.textContent).toContain('Ce compte est déjà suspendu.');
    expect(racine().querySelector('textarea')).not.toBeNull();
    expect(messages).toEqual([]);
  });

  it('ne montre l’historique que s’il y a des décisions, et le déplie à la demande', async () => {
    demarrer(compte({ statutCompte: 'ACTIF' }));
    expect(libelles()).toEqual(['Suspendre']);

    fixture.componentRef.setInput('compte', compte({ statutCompte: 'ACTIF', nombreDecisions: 2 }));
    fixture.detectChanges();
    const bouton = boutons().find((b) => b.textContent?.includes('Historique')) as HTMLButtonElement;
    expect(bouton.textContent).toContain('(2)');
    expect(bouton.getAttribute('aria-expanded')).toBe('false');

    bouton.click();
    fixture.detectChanges();
    http.expectOne('/api/admin/comptes/c1/historique').flush([
      { id: 'a1', type: 'REACTIVATION', motif: null, details: null, dateAction: '2026-10-20T10:00:00Z', auteur: 'Admin EPT' },
      { id: 'a2', type: 'SUSPENSION', motif: 'Contenus abusifs', details: null, dateAction: '2026-10-19T10:00:00Z', auteur: 'Admin EPT' },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(bouton.getAttribute('aria-expanded')).toBe('true');
    const entrees = [...racine().querySelectorAll('app-historique-compte li')] as HTMLElement[];
    expect(entrees.map((entree) => entree.querySelector('strong')?.textContent)).toEqual(['Compte réactivé', 'Compte suspendu']);
    expect(entrees[1].textContent).toContain('Contenus abusifs');
  });
});
