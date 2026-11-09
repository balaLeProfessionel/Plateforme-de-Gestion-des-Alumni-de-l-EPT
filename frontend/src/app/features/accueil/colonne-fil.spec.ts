import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth-service';
import { ColonneFil } from './colonne-fil';

const mentor = (id: string, filiere: string) => ({
  profilId: `p-${id}`, utilisateurId: id, nom: id, prenom: 'Mentor', urlPhoto: null, posteActuel: null, filiere,
  anneeSortie: 2015, presentation: null, domaines: [], disponible: true, placesRestantes: 1, demandeEnCours: false, role: 'ALUMNI',
});

describe('ColonneFil', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    registerLocaleData(localeFr);
    TestBed.configureTestingModule({
      imports: [ColonneFil],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' },
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi', role: 'ETUDIANT', prenom: 'Awa', nom: 'Diop' }) } }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('montre les prochains événements, les mentors de ma filière et ce qui manque à mon profil', async () => {
    const fixture = TestBed.createComponent(ColonneFil);
    fixture.detectChanges();

    http.expectOne((r) => r.url === '/api/evenements').flush({ contenu: [
      { id: 'e1', titre: 'Gala 2026', dateDebut: '2026-11-22T18:00:00', lieu: 'Dakar' },
    ], page: 0, taille: 3, totalElements: 1, totalPages: 1 });
    http.expectOne('/api/profil/me').flush({
      id: 'moi', urlPhoto: null, bio: null, posteActuel: null, villeResidence: 'Thiès', lienLinkedin: null, filiere: 'Génie Civil',
    });
    http.expectOne((r) => r.url.includes('experiences')).flush([]);
    http.expectOne((r) => r.url.includes('formations')).flush([]);
    http.expectOne((r) => r.url.includes('/mentors')).flush({ contenu: [
      mentor('moi', 'Génie Civil'), mentor('autre', 'Génie Informatique'), mentor('civil', 'Génie Civil'),
    ], page: 0, taille: 24, totalElements: 3, totalPages: 1 });
    await fixture.whenStable();
    fixture.detectChanges();

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('#titre-prochains + ul a')?.getAttribute('href')).toBe('/evenements/e1');
    expect(racine.querySelector('#titre-mentors')?.textContent).toBe('Mentors de votre filière');
    expect([...racine.querySelectorAll('.mentor a')].map((a) => a.getAttribute('href'))).toEqual(['/profil/civil']);
    expect(racine.querySelector('app-completude-profil [role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('14');
  });
});
