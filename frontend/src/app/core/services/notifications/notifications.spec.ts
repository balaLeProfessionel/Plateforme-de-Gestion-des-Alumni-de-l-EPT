import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { INTERVALLE_NOTIFICATIONS, NotificationService } from './notifications';

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.arreter();
    vi.useRealTimers();
    http.verify();
  });

  it('relève le compteur tout de suite puis à intervalle régulier, une seule fois', () => {
    vi.useFakeTimers();
    service.demarrer();
    service.demarrer();
    vi.advanceTimersByTime(0);
    http.expectOne('/api/notifications/non-lues').flush({ nombre: 4 });
    expect(service.nonLues()).toBe(4);

    vi.advanceTimersByTime(INTERVALLE_NOTIFICATIONS);
    http.expectOne('/api/notifications/non-lues').flush({ nombre: 5 });
    expect(service.nonLues()).toBe(5);

    service.arreter();
    vi.advanceTimersByTime(INTERVALLE_NOTIFICATIONS);
    http.expectNone('/api/notifications/non-lues');
  });

  it('tient le compteur à jour quand on liste et quand on marque lu', () => {
    service.lister(0).subscribe();
    const liste = http.expectOne((requete) => requete.url === '/api/notifications');
    expect(liste.request.params.get('taille')).toBe('10');
    liste.flush({ contenu: [], page: 0, taille: 10, totalElements: 2, totalPages: 1, nonLues: 2 });
    expect(service.nonLues()).toBe(2);

    service.marquerLue('a/b').subscribe();
    const marquage = http.expectOne('/api/notifications/a%2Fb/lue');
    expect(marquage.request.method).toBe('POST');
    marquage.flush(null);
    expect(service.nonLues()).toBe(1);

    service.toutMarquerLu().subscribe();
    http.expectOne('/api/notifications/lues').flush(null);
    expect(service.nonLues()).toBe(0);
  });
});
