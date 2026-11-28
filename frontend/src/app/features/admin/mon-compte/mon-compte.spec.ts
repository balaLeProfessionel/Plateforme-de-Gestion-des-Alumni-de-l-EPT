import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MonCompte } from './mon-compte';

describe('MonCompte', () => {
  let fixture: ComponentFixture<MonCompte>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('auth_user', JSON.stringify({
      id: 'a1', role: 'ADMIN', prenom: 'Mame Diarra', nom: 'Ndour', email: 'mdndour@ept.sn', doitChangerMotDePasse: false,
    }));
    TestBed.configureTestingModule({
      imports: [MonCompte],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MonCompte);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    // Bloc « Connexion avec Google » : état de la liaison et configuration du bouton
    http.match('/api/auth/google/liaison');
    http.match('/api/auth/google/configuration');
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
  const soumettre = async (id: string) => {
    racine().querySelector(`#${id}`)?.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  it('propose de lier un compte Google à son compte administrateur', () => {
    http.expectOne('/api/auth/google/liaison').flush({ lie: false, emailGoogle: null, motDePasseDefini: true });
    fixture.detectChanges();
    const section = racine().querySelector('section[aria-labelledby="titre-google"]');
    expect(section?.querySelector('h2')?.textContent).toBe('Connexion avec Google');
    expect(section?.querySelector('app-bouton-google')).not.toBeNull();
  });

  it('corrige le nom et relit le compte pour l’afficher partout', async () => {
    expect((racine().querySelector('#mon-prenom') as HTMLInputElement).value).toBe('Mame Diarra');
    expect(racine().textContent).toContain('mdndour@ept.sn');
    saisir('mon-nom', ' Ndour Sarr ');
    await soumettre('form-identite');

    const requete = http.expectOne({ method: 'PATCH', url: '/api/admin/mon-compte/identite' });
    expect(requete.request.body).toEqual({ prenom: 'Mame Diarra', nom: 'Ndour Sarr' });
    requete.flush(null, { status: 204, statusText: 'No Content' });
    http.expectOne('/api/auth/me').flush({ nom: 'Ndour Sarr', prenom: 'Mame Diarra', role: 'ADMIN', statutCompte: 'ACTIF' });
    fixture.detectChanges();
    expect(racine().querySelector('[role="status"] .message')?.textContent).toContain('Nom enregistré');
  });

  it('refuse un nom vide sans rien envoyer et met le focus sur le champ', async () => {
    saisir('mon-prenom', '');
    await soumettre('form-identite');
    http.expectNone('/api/admin/mon-compte/identite');
    expect(document.activeElement?.id).toBe('mon-prenom');
    expect(racine().querySelector('#erreur-mon-prenom')?.textContent).toBe('Le prénom est obligatoire.');
  });

  it('change le mot de passe après avoir vérifié la confirmation sur le bon champ', async () => {
    saisir('mdp-actuel', 'Ancien-Mot-1');
    saisir('mdp-nouveau', 'Nouveau-Mot-1');
    saisir('mdp-confirmation', 'Autre-Mot-1');
    await soumettre('form-mot-de-passe');
    http.expectNone('/api/auth/changer-mot-de-passe');
    expect(document.activeElement?.id).toBe('mdp-confirmation');

    saisir('mdp-confirmation', 'Nouveau-Mot-1');
    await soumettre('form-mot-de-passe');
    const requete = http.expectOne('/api/auth/changer-mot-de-passe');
    expect(requete.request.body).toEqual({ motDePasseActuel: 'Ancien-Mot-1', nouveauMotDePasse: 'Nouveau-Mot-1' });
    requete.flush({ accessToken: 't', refreshToken: 'r', id: 'a1', role: 'ADMIN', prenom: 'Mame Diarra', nom: 'Ndour' });
    fixture.detectChanges();
    expect(racine().textContent).toContain('Mot de passe modifié');
    expect((racine().querySelector('#mdp-actuel') as HTMLInputElement).value).toBe('');
  });

  it('dit quand le mot de passe actuel est faux', async () => {
    saisir('mdp-actuel', 'Faux-Mot-1');
    saisir('mdp-nouveau', 'Nouveau-Mot-1');
    saisir('mdp-confirmation', 'Nouveau-Mot-1');
    await soumettre('form-mot-de-passe');
    http.expectOne('/api/auth/changer-mot-de-passe').flush({ message: 'Bad credentials' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(racine().textContent).toContain('Le mot de passe actuel est incorrect.');
  });
});
