import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../../../core/services/auth/auth-service';
import { PremiereConnexion } from './premiere-connexion';

describe('PremiereConnexion', () => {
  let fixture: ComponentFixture<PremiereConnexion>;
  let http: HttpTestingController;

  async function demarrer(role: string, prenom = 'Awa', nom = 'Diop'): Promise<void> {
    localStorage.setItem('auth_refresh', 'ancien-refresh-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: 'u1', role, prenom, nom, doitChangerMotDePasse: true }));
    await TestBed.configureTestingModule({
      imports: [PremiereConnexion],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PremiereConnexion);
    await fixture.whenStable();
  }

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  const racine = () => fixture.nativeElement as HTMLElement;
  const saisir = (id: string, valeur: string) => {
    const champ = racine().querySelector(`#${id}`) as HTMLInputElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const soumettre = async () => {
    racine().querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const reponse = (role: string, prenom: string, nom: string) => ({
    accessToken: 'nouvel-access-token', refreshToken: 'nouveau-refresh-token', id: 'u1', email: 'membre@example.invalid',
    nom, prenom, role, statutCompte: 'ACTIF', doitChangerMotDePasse: false,
  });

  it('s’adresse à tous les comptes sans les supposer étudiants, sans règle ni erreur à l’ouverture', async () => {
    await demarrer('ALUMNI');
    expect(racine().textContent).not.toContain('étudiant');
    expect(racine().querySelector('#aide-nouveau')).toBeNull();
    expect(racine().querySelector('[aria-invalid="true"]')).toBeNull();
    expect(racine().querySelector('#premier-prenom')).toBeNull();
  });

  it('ne montre la règle des 8 caractères que pendant la saisie d’un mot de passe trop court', async () => {
    await demarrer('ALUMNI');
    const champ = racine().querySelector('#nouveauMotDePasse') as HTMLInputElement;
    saisir('nouveauMotDePasse', 'abc');
    expect(racine().querySelector('#aide-nouveau')?.textContent).toContain('Au moins 8 caractères');
    expect(champ.getAttribute('aria-describedby')).toBe('aide-nouveau');
    saisir('nouveauMotDePasse', 'abcdefgh');
    expect(racine().querySelector('#aide-nouveau')).toBeNull();
    expect(champ.getAttribute('aria-describedby')).toBeNull();
  });

  it('refuse deux mots de passe différents sur le champ concerné, et efface l’erreur une fois corrigé', async () => {
    await demarrer('ETUDIANT');
    saisir('nouveauMotDePasse', 'NouveauPass2026!');
    saisir('confirmation', 'AutrePass2026!');
    await soumettre();

    http.expectNone('/api/auth/changer-mot-de-passe-initial');
    const confirmation = racine().querySelector('#confirmation') as HTMLInputElement;
    expect(racine().querySelector('#erreur-confirmation')?.textContent).toBe('Les deux mots de passe ne correspondent pas.');
    expect(confirmation.getAttribute('aria-invalid')).toBe('true');
    expect(confirmation.getAttribute('aria-describedby')).toBe('erreur-confirmation');
    expect(document.activeElement).toBe(confirmation);

    saisir('confirmation', 'NouveauPass2026!');
    expect(racine().querySelector('#erreur-confirmation')).toBeNull();
  });

  it('enregistre le nouveau mot de passe d’un membre et ouvre la complétion du profil', async () => {
    await demarrer('ETUDIANT');
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    saisir('nouveauMotDePasse', 'NouveauPass2026!');
    saisir('confirmation', 'NouveauPass2026!');
    await soumettre();

    const requete = http.expectOne('/api/auth/changer-mot-de-passe-initial');
    expect(requete.request.body).toEqual({ nouveauMotDePasse: 'NouveauPass2026!', refreshToken: 'ancien-refresh-token' });
    requete.flush(reponse('ETUDIANT', 'Awa', 'Diop'));
    expect(navigation).toHaveBeenCalledWith(['/completer-profil'], { state: { compteDeLEcole: true } });
  });

  it('demande au premier administrateur son vrai nom, sans préremplir le nom de service', async () => {
    await demarrer('ADMIN', 'Administration', 'EPT');
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    expect((racine().querySelector('#premier-prenom') as HTMLInputElement).value).toBe('');
    saisir('nouveauMotDePasse', 'NouveauPass2026!');
    saisir('confirmation', 'NouveauPass2026!');
    await soumettre();
    http.expectNone('/api/auth/changer-mot-de-passe-initial');
    expect(document.activeElement?.id).toBe('premier-prenom');

    saisir('premier-prenom', ' Mame Diarra ');
    saisir('premier-nom', 'Ndour');
    await soumettre();
    const requete = http.expectOne('/api/auth/changer-mot-de-passe-initial');
    expect(requete.request.body).toEqual({
      nouveauMotDePasse: 'NouveauPass2026!', refreshToken: 'ancien-refresh-token', prenom: 'Mame Diarra', nom: 'Ndour',
    });
    requete.flush(reponse('ADMIN', 'Mame Diarra', 'Ndour'));
    expect(navigation).toHaveBeenCalledWith(['/admin']);
  });

  it('affiche le refus du serveur, par exemple le mot de passe provisoire réutilisé', async () => {
    await demarrer('ALUMNI');
    saisir('nouveauMotDePasse', 'Provisoire-1');
    saisir('confirmation', 'Provisoire-1');
    await soumettre();
    http.expectOne('/api/auth/changer-mot-de-passe-initial').flush(
      { message: 'Choisissez un mot de passe différent du mot de passe provisoire.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(racine().querySelector('[role="alert"]')?.textContent).toContain('différent du mot de passe provisoire');
  });

  it('permet de se déconnecter sans changer le mot de passe', async () => {
    await demarrer('ALUMNI');
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const deconnexion = vi.spyOn(TestBed.inject(AuthService), 'logout').mockImplementation(() => {});
    ([...racine().querySelectorAll('button')].find((b) => b.textContent?.includes('Se déconnecter')) as HTMLButtonElement).click();
    expect(deconnexion).toHaveBeenCalled();
    expect(navigation).toHaveBeenCalledWith(['/connexion']);
  });
});
