import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AudienceEvenement, EvenementRequest } from '../models/evenement';

import { EvenementService } from './evenement';

describe('EvenementService', () => {
  let service: EvenementService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EvenementService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envoie la période et la pagination demandées', () => {
    service.lister('PASSES', 2, 24).subscribe();

    const requete = http.expectOne('/api/evenements?periode=PASSES&page=2&taille=24');
    expect(requete.request.method).toBe('GET');
    requete.flush({ contenu: [], page: 2, taille: 24, totalElements: 0, totalPages: 0 });
  });

  it('encode l’identifiant de l’événement dans la requête de détail', () => {
    service.obtenir('event id/1').subscribe();

    const requete = http.expectOne('/api/evenements/event%20id%2F1');
    expect(requete.request.method).toBe('GET');
    requete.flush({});
  });

  it('demande uniquement les événements de la session pour la période et la page choisies', () => {
    service.listerMesEvenements('AVENIR', 1, 12).subscribe();

    const requete = http.expectOne('/api/evenements/mes-evenements?periode=AVENIR&page=1&taille=12');
    expect(requete.request.method).toBe('GET');
    requete.flush({ contenu: [], page: 1, taille: 12, totalElements: 0, totalPages: 0 });
  });

  it('envoie seulement les champs modifiables lors de la création', () => {
    const evenement: EvenementRequest = {
      titre: 'Rencontre Alumni', description: 'Une rencontre EPT', lieu: 'Thiès',
      dateDebut: '2026-10-15T09:00:00Z', dateFin: '2026-10-15T12:00:00Z',
      audience: 'ALUMNI' satisfies AudienceEvenement, nombrePlaces: null,
    };
    service.creer(evenement).subscribe();

    const requete = http.expectOne('/api/evenements');
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual(evenement);
    expect(requete.request.body.officielEpt).toBeUndefined();
    requete.flush({});
  });

  it('joint une image en multipart en laissant le navigateur définir la frontière', () => {
    const image = new File(['image'], 'affiche.png', { type: 'image/png' });
    service.joindreImage('event-1', image).subscribe();

    const requete = http.expectOne('/api/evenements/event-1/image');
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toBeInstanceOf(FormData);
    expect(requete.request.body.get('image')).toBe(image);
    expect(requete.request.headers.has('Content-Type')).toBe(false);
    requete.flush({ urlImage: '/api/evenement-images/image.png' });
  });

  it('supprime une image seulement sur la route de gestion de son événement', () => {
    service.supprimerImage('event-1').subscribe();

    const requete = http.expectOne('/api/evenements/event-1/image');
    expect(requete.request.method).toBe('DELETE');
    requete.flush({ urlImage: null });
  });

  it('charge les participants uniquement par la route dédiée à leur événement', () => {
    service.listerParticipants('event-1', 2).subscribe();

    const requete = http.expectOne('/api/evenements/event-1/participants?page=2&taille=12');
    expect(requete.request.method).toBe('GET');
    requete.flush({ contenu: [], page: 2, taille: 12, totalElements: 0, totalPages: 0 });
  });

  it('enregistre une réponse sur la route de participation de l’événement', () => {
    service.repondre('event-1', 'PARTICIPERA').subscribe();

    const requete = http.expectOne('/api/evenements/event-1/participation');
    expect(requete.request.method).toBe('PUT');
    expect(requete.request.body).toEqual({ reponse: 'PARTICIPERA' });
    requete.flush({ maReponse: 'PARTICIPERA', nombreParticipants: 1 });
  });
});
