import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth-service';
import { simulerDialogue, unMentor, unMentorat, saisir, soumettre } from '../testing/donnees-mentorat';
import { OffreMentoratProfil } from './offre-mentorat-profil';

describe('OffreMentoratProfil', () => {
  let fixture: ComponentFixture<OffreMentoratProfil>;
  let http: HttpTestingController;
  const utilisateur = signal<{ role: string } | null>({ role: 'ETUDIANT' });

  function afficher(utilisateurId: string, estMonProfil = false): HTMLElement {
    fixture = TestBed.createComponent(OffreMentoratProfil);
    fixture.componentRef.setInput('utilisateurId', utilisateurId);
    fixture.componentRef.setInput('estMonProfil', estMonProfil);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => {
    simulerDialogue();
    utilisateur.set({ role: 'ETUDIANT' });
    TestBed.configureTestingModule({
      imports: [OffreMentoratProfil],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: { utilisateur } }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('ne montre rien pour un alumni qui ne propose pas de mentorat', async () => {
    const racine = afficher('u9');
    http.expectOne('/api/mentorat/mentors/utilisateur/u9').flush({ message: 'introuvable' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(racine.querySelector('.offre')).toBeNull();
  });

  it('présente l’offre et laisse un étudiant demander un mentorat depuis le profil', async () => {
    const racine = afficher('u1');
    http.expectOne('/api/mentorat/mentors/utilisateur/u1').flush(unMentor({ placesRestantes: 1 }));
    await fixture.whenStable();

    expect(racine.querySelector('.etat')?.textContent).toContain('Disponible · 1 place');
    expect(racine.querySelector('.domaines')?.textContent).toContain('Data & IA');
    (racine.querySelector('button.principale') as HTMLButtonElement).click();
    fixture.detectChanges();

    saisir(racine.querySelector('#demande-objectif') as HTMLTextAreaElement, 'Préparer mon stage');
    fixture.detectChanges();
    soumettre(racine.querySelector('.dialogue form') as HTMLFormElement);
    await fixture.whenStable();
    http.expectOne('/api/mentorat/mentorats').flush(unMentorat());
    await fixture.whenStable();
    fixture.detectChanges();

    expect(racine.querySelector('.confirmation')?.textContent).toContain('Votre demande a été envoyée');
    expect(racine.querySelector('button.principale')).toBeNull();
  });

  it.each([
    [{ demandeEnCours: true }, 'déjà une demande en cours'],
    [{ disponible: false }, 'n’accepte pas de nouvelle demande'],
    [{ placesRestantes: 0 }, 'nombre maximum'],
  ])('explique pourquoi la demande est impossible (%o)', async (etat, raison) => {
    const racine = afficher('u1');
    http.expectOne('/api/mentorat/mentors/utilisateur/u1').flush(unMentor(etat));
    await fixture.whenStable();
    expect(racine.querySelector('button.principale')).toBeNull();
    expect(racine.querySelector('.blocage')?.textContent).toContain(raison);
  });

  it('n’offre pas la demande aux visiteurs qui ne sont pas étudiants', async () => {
    utilisateur.set({ role: 'ALUMNI' });
    const racine = afficher('u1');
    http.expectOne('/api/mentorat/mentors/utilisateur/u1').flush(unMentor());
    await fixture.whenStable();
    expect(racine.querySelector('.offre')).not.toBeNull();
    expect(racine.querySelector('button')).toBeNull();
  });

  it('sur mon profil, résume mon offre ou m’invite à en proposer une', async () => {
    let racine = afficher('moi', true);
    http.expectOne('/api/mentorat/profil').flush({
      id: 'p', presentation: null, disponible: true, capaciteMax: 3, mentoresActifs: 1,
      domaines: [{ id: 'd1', code: 'DATA_IA', libelle: 'Data & IA' }],
    });
    await fixture.whenStable();
    expect(racine.querySelector('.etat')?.textContent).toContain('1 / 3 mentorés');
    expect(racine.querySelector('a.action')?.getAttribute('href')).toBe('/mentorat/offre');

    racine = afficher('moi', true);
    http.expectOne('/api/mentorat/profil').flush({ message: 'introuvable' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(racine.querySelector('a.principale')?.textContent).toContain('Proposer du mentorat');
  });
});
