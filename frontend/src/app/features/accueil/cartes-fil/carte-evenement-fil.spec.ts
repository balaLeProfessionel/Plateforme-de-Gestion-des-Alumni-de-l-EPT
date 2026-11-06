import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { Evenement } from '../../../core/services/models/evenement';
import { CarteEvenementFil } from './carte-evenement-fil';

const base: Evenement = {
  id: 'e1', titre: 'Rencontre alumni Dakar', description: '', lieu: 'Dakar', urlImage: null,
  dateDebut: '2026-11-12T18:00:00Z', dateFin: null, audience: 'TOUS', nombrePlaces: null, officielEpt: true,
  statut: 'PUBLIE', organisateurId: 'o1', organisateurNom: 'Sarr', organisateurPrenom: 'Fatou',
  nombreParticipants: 3, maReponse: null,
};

describe('CarteEvenementFil', () => {
  const utilisateur = signal<{ id: string; role: string } | null>({ id: 'moi', role: 'ALUMNI' });
  let http: HttpTestingController;
  beforeEach(() => {
    utilisateur.set({ id: 'moi', role: 'ALUMNI' });
    registerLocaleData(localeFr);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: { utilisateur } }, { provide: LOCALE_ID, useValue: 'fr' }],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function afficher(evenement: Partial<Evenement>) {
    const fixture = TestBed.createComponent(CarteEvenementFil);
    fixture.componentRef.setInput('evenement', { ...base, ...evenement });
    fixture.detectChanges();
    return { fixture, racine: fixture.nativeElement as HTMLElement };
  }

  it('montre la tuile de date sans image, et un bandeau sans tuile avec image', () => {
    const tuile = afficher({}).racine.querySelector('.tuile');
    expect(tuile?.querySelector('.mois')?.textContent?.trim()).toBe('nov');
    expect(tuile?.querySelector('.jour')?.textContent?.trim()).toBe('12');
    const avecImage = afficher({ urlImage: '/api/images/e1.jpg' }).racine;
    expect(avecImage.querySelector('.bandeau')).not.toBeNull();
    expect(avecImage.querySelector('.tuile')).toBeNull();
  });

  it('inscrit depuis le fil puis permet de se désinscrire', () => {
    const { fixture, racine } = afficher({});
    const bouton = racine.querySelector('.participer') as HTMLButtonElement;
    expect(bouton.getAttribute('aria-pressed')).toBe('false');
    bouton.click();
    const requete = http.expectOne('/api/evenements/e1/participation');
    expect(requete.request.body).toEqual({ reponse: 'PARTICIPERA' });
    requete.flush({ ...base, maReponse: 'PARTICIPERA', nombreParticipants: 4 });
    fixture.detectChanges();
    expect(bouton.getAttribute('aria-pressed')).toBe('true');
    expect(racine.querySelector('.participants')?.textContent).toContain('4 participants');
    bouton.click();
    expect(http.expectOne('/api/evenements/e1/participation').request.body).toEqual({ reponse: 'NE_PARTICIPERA_PAS' });
  });

  it('signale une erreur sans changer l’état affiché', () => {
    const { fixture, racine } = afficher({});
    (racine.querySelector('.participer') as HTMLButtonElement).click();
    http.expectOne('/api/evenements/e1/participation').flush(null, { status: 409, statusText: 'Conflit' });
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('complet');
    expect(racine.querySelector('.participer')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('cache le bouton hors de l’audience, et affiche « Complet » quand il n’y a plus de place', () => {
    expect(afficher({ audience: 'ETUDIANTS' }).racine.querySelector('.participer')).toBeNull();
    const complet = afficher({ nombrePlaces: 3 }).racine;
    expect(complet.querySelector('.participer')).toBeNull();
    expect(complet.querySelector('.complet')?.textContent).toContain('Complet');
  });
});
