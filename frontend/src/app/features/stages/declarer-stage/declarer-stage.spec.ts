import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { DeclarerStage } from './declarer-stage';

describe('DeclarerStage', () => {
  let fixture: ComponentFixture<DeclarerStage>;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [DeclarerStage], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DeclarerStage);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  const racine = () => fixture.nativeElement as HTMLElement;
  const saisir = (id: string, valeur: string) => {
    const champ = racine().querySelector(id) as HTMLInputElement | HTMLSelectElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    champ.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  const soumettre = () => {
    racine().querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  };
  const remplir = (organisme: string) => {
    saisir('#declaration-organisme', organisme);
    vi.advanceTimersByTime(250);
    saisir('#declaration-type', 'MAITRISE');
    saisir('#declaration-sujet', 'Application mobile');
    saisir('#declaration-debut', '2027-02-01');
    saisir('#declaration-fin', '2027-04-30');
    saisir('#declaration-tuteur', 'Moussa Ndiaye');
  };

  it('signale les champs obligatoires sans rien envoyer', () => {
    soumettre();
    const erreurs = [...racine().querySelectorAll('.erreur-champ')].map((e) => e.textContent?.trim());
    expect(erreurs).toContain('Indiquez l’organisme qui vous accueille.');
    expect(erreurs).toContain('Le nom du maître de stage est obligatoire.');
    saisir('#declaration-debut', '2027-03-01');
    saisir('#declaration-fin', '2027-02-01');
    expect(racine().textContent).toContain('La fin du stage ne peut pas précéder son début.');
  });

  it('envoie l’identifiant d’un organisme connu de la plateforme', () => {
    remplir('Kër Data');
    http.expectOne((r) => r.url === '/api/organisme/recherche' && r.params.get('q') === 'Kër Data').flush([{ id: 'org1', nom: 'Kër Data' }]);
    fixture.detectChanges();
    expect(racine().querySelector('#aide-organisme')?.textContent).toContain('Organisme connu de la plateforme');
    soumettre();
    const requete = http.expectOne({ method: 'POST', url: '/api/stages/declarations' });
    expect(requete.request.body).toEqual({
      organismeId: 'org1', nomOrganisme: null, typeStage: 'MAITRISE', sujet: 'Application mobile', lieu: null,
      dateDebut: '2027-02-01', dateFin: '2027-04-30', tuteurNom: 'Moussa Ndiaye', tuteurFonction: null, tuteurEmail: null, tuteurTelephone: null,
    });
    requete.flush({ id: 'd1', sujet: 'Application mobile', organisme: 'Kër Data' });
    fixture.detectChanges();
    expect(racine().querySelector('.resultat')?.textContent).toContain('Déclaration envoyée à l’école');
    expect(racine().querySelector('.resultat a')?.getAttribute('href')).toBe('/stages/mes-stages');
  });

  it('nomme un organisme inconnu et affiche l’erreur du serveur', () => {
    remplir('Startup inconnue');
    http.expectOne((r) => r.url === '/api/organisme/recherche').flush([]);
    fixture.detectChanges();
    expect(racine().querySelector('#aide-organisme')?.textContent).toContain('l’école l’enregistrera');
    soumettre();
    const requete = http.expectOne({ method: 'POST', url: '/api/stages/declarations' });
    expect(requete.request.body.organismeId).toBeNull();
    expect(requete.request.body.nomOrganisme).toBe('Startup inconnue');
    requete.flush({ message: 'Test a déjà un stage confirmé chez Sonatel : les dates se chevauchent.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(racine().querySelector('[role="alert"]')?.textContent).toContain('les dates se chevauchent');
  });
});
