import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommentairesPublication } from './commentaires-publication';

describe('CommentairesPublication', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CommentairesPublication], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('charge les commentaires et envoie une réponse au commentaire choisi', async () => {
    const fixture = TestBed.createComponent(CommentairesPublication);
    fixture.componentRef.setInput('publicationId', 'publication-1');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.ouvrir') as HTMLButtonElement).click();
    const lecture = http.expectOne((req) => req.url === '/api/publications/publication-1/commentaires');
    expect(lecture.request.params.get('page')).toBe('0');
    lecture.flush({ contenu: [{ id: 'commentaire-1', publicationId: 'publication-1', parentId: null,
      auteurId: 'a1', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurPhoto: null,
      contenu: 'Très intéressant', creeLe: '2026-11-03T10:00:00Z' }], page: 0, taille: 20, totalElements: 1, totalPages: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Très intéressant');
    (fixture.nativeElement.querySelector('.repondre') as HTMLButtonElement).click();
    fixture.detectChanges();
    const saisie = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    saisie.value = 'Merci pour le partage';
    saisie.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    const envoi = http.expectOne('/api/publications/publication-1/commentaires');
    expect(envoi.request.method).toBe('POST');
    expect(envoi.request.body).toEqual({ contenu: 'Merci pour le partage', parentId: 'commentaire-1' });
    envoi.flush({ id: 'reponse-1', publicationId: 'publication-1', parentId: 'commentaire-1',
      auteurId: 'a2', auteurNom: 'Ba', auteurPrenom: 'Moussa', contenu: 'Merci pour le partage', creeLe: '2026-11-03T10:01:00Z' });
    await fixture.whenStable();
    const actualisation = http.expectOne((req) => req.url === '/api/publications/publication-1/commentaires' && req.method === 'GET');
    actualisation.flush({ contenu: [{ id: 'commentaire-1', publicationId: 'publication-1', parentId: null,
      auteurId: 'a1', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurPhoto: null, contenu: 'Très intéressant', creeLe: '2026-11-03T10:00:00Z' },
      { id: 'reponse-1', publicationId: 'publication-1', parentId: 'commentaire-1', auteurId: 'a2', auteurNom: 'Ba',
        auteurPrenom: 'Moussa', auteurPhoto: null, contenu: 'Merci pour le partage', creeLe: '2026-11-03T10:01:00Z' }],
      page: 0, taille: 20, totalElements: 2, totalPages: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Votre commentaire a été ajouté.');
    expect(fixture.nativeElement.querySelector('.reponse')).not.toBeNull();
  });

  it('refuse un commentaire vide avant l’appel réseau', async () => {
    const fixture = TestBed.createComponent(CommentairesPublication);
    fixture.componentRef.setInput('publicationId', 'publication-2');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.ouvrir') as HTMLButtonElement).click();
    http.expectOne((req) => req.method === 'GET').flush({ contenu: [], page: 0, taille: 20, totalElements: 0, totalPages: 0 });
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Saisissez un commentaire');
    http.expectNone((req) => req.method === 'POST');
  });
});
