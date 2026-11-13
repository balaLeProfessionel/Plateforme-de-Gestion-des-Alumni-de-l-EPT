import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth-service';
import { DetailPublication } from './detail-publication';

describe('DetailPublication', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    registerLocaleData(localeFr);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' },
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'lecteur', prenom: 'Moussa', nom: 'Ba', role: 'ETUDIANT' }) } },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'p1' })),
          snapshot: { queryParamMap: convertToParamMap({}) } } }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('affiche la publication complète avec toute sa discussion', async () => {
    const fixture = TestBed.createComponent(DetailPublication);
    fixture.detectChanges();
    http.expectOne('/api/publications/p1').flush({ id: 'p1', type: 'PUBLICATION', titre: null,
      contenu: 'Un texte long. '.repeat(40), audience: 'TOUS', urlImage: null, texteAlternatif: null, dateLimite: null,
      publieLe: '2026-10-01T10:00:00Z', auteurId: 'a1', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI',
      auteurPhoto: null, nombreJaime: 0, jaime: false, nombreCommentaires: 0, apercuCommentaire: null });
    fixture.detectChanges();
    await fixture.whenStable();
    const racine: HTMLElement = fixture.nativeElement;
    expect(racine.querySelector('.contenu.tronque, .voir-plus')).toBeNull();
    http.expectOne((req) => req.url === '/api/publications/p1/commentaires')
      .flush({ contenu: [], page: 0, taille: 20, totalElements: 0, totalPages: 0 });
    fixture.detectChanges();
    expect(racine.querySelector('app-commentaires-publication textarea')).not.toBeNull();
    http.verify();
  });

  it('explique qu’une publication retirée ou réservée n’est plus disponible', () => {
    const fixture = TestBed.createComponent(DetailPublication);
    fixture.detectChanges();
    http.expectOne('/api/publications/p1').flush({ message: 'Introuvable' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('n’est plus disponible');
  });
});
