import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CompteurDemandesMentorat } from './compteur-demandes';
import { MentoratService } from './mentorat';

describe('MentoratService', () => {
  let service: MentoratService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(MentoratService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('n’envoie que les critères de recherche utiles', () => {
    service.rechercherMentors({ recherche: '  awa ', domaine: '', disponibles: true, page: 2 }).subscribe();
    const requete = http.expectOne((req) => req.url === '/api/mentorat/mentors');
    expect(requete.request.params.get('recherche')).toBe('awa');
    expect(requete.request.params.has('domaine')).toBe(false);
    expect(requete.request.params.get('disponibles')).toBe('true');
    expect(requete.request.params.get('page')).toBe('2');
    expect(requete.request.params.get('taille')).toBe('12');
    requete.flush({});
  });

  it('répète le paramètre statut pour chaque statut demandé', () => {
    service.lister('MENTOR', ['ACCEPTEE', 'TERMINEE'], 0).subscribe();
    const requete = http.expectOne((req) => req.url === '/api/mentorat/mentorats');
    expect(requete.request.params.get('role')).toBe('MENTOR');
    expect(requete.request.params.getAll('statut')).toEqual(['ACCEPTEE', 'TERMINEE']);
    requete.flush({});
  });

  it('encode les identifiants dans les adresses', () => {
    service.obtenir('a/b').subscribe();
    http.expectOne('/api/mentorat/mentorats/a%2Fb').flush({});
    service.suivreSeance('m 1', 's?1', 'REALISEE', null).subscribe();
    const requete = http.expectOne('/api/mentorat/mentorats/m%201/seances/s%3F1');
    expect(requete.request.method).toBe('PATCH');
    requete.flush({});
  });

  it('utilise le bon verbe pour chaque changement de statut', () => {
    service.refuser('m1', 'Agenda').subscribe();
    const refus = http.expectOne('/api/mentorat/mentorats/m1/refuser');
    expect(refus.request.method).toBe('PATCH');
    expect(refus.request.body).toEqual({ motif: 'Agenda' });
    refus.flush({});
    service.enregistrerMonProfil({ presentation: null, disponible: true, capaciteMax: 3, domaineIds: ['d1'] }).subscribe();
    expect(http.expectOne('/api/mentorat/profil').request.method).toBe('PUT');
  });
});

describe('CompteurDemandesMentorat', () => {
  it('reprend les compteurs du serveur et retombe à zéro en cas d’erreur', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const compteur = TestBed.inject(CompteurDemandesMentorat);
    const http = TestBed.inject(HttpTestingController);

    compteur.actualiser();
    expect(compteur.limiteAtteinte()).toBe(false);
    http.expectOne('/api/mentorat/mentorats/compteurs')
      .flush({ demandesRecuesEnAttente: 4, demandesEnvoyeesEnAttente: 3, demandesEnAttenteMax: 3 });
    expect(compteur.nombre()).toBe(4);
    expect(compteur.envoyees()).toBe(3);
    expect(compteur.limiteAtteinte()).toBe(true);

    compteur.actualiser();
    http.expectOne('/api/mentorat/mentorats/compteurs').flush({}, { status: 500, statusText: 'Erreur' });
    expect(compteur.nombre()).toBe(0);
    expect(compteur.limiteAtteinte()).toBe(false);
    http.verify();
  });
});
