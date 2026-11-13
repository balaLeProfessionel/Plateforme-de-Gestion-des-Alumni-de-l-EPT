import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CommentairesPublication } from './commentaires-publication';

describe('CommentairesPublication', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CommentairesPublication], providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi', prenom: 'Moussa', nom: 'Ba', role: 'ETUDIANT' }) } }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('charge les commentaires et envoie une réponse au commentaire choisi', async () => {
    const fixture = TestBed.createComponent(CommentairesPublication);
    fixture.componentRef.setInput('publicationId', 'publication-1');
    fixture.componentRef.setInput('ouverte', true);
    fixture.detectChanges();
    const lecture = http.expectOne((req) => req.url === '/api/publications/publication-1/commentaires');
    expect(lecture.request.params.get('page')).toBe('0');
    lecture.flush({ contenu: [{ id: 'commentaire-1', publicationId: 'publication-1', parentId: null,
      auteurId: 'a1', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI', auteurPhoto: null,
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
    envoi.flush({ id: 'reponse-1', publicationId: 'publication-1', parentId: 'commentaire-1', auteurId: 'moi',
      auteurNom: 'Ba', auteurPrenom: 'Moussa', auteurRole: 'ETUDIANT', auteurPhoto: null,
      contenu: 'Merci pour le partage', creeLe: '2026-11-03T10:01:00Z' });
    await fixture.whenStable();
    fixture.detectChanges();
    // La réponse s’insère sous son commentaire, sans recharger tout le fil.
    http.expectNone((req) => req.method === 'GET');
    const fil = fixture.nativeElement.querySelector('.fil') as HTMLElement;
    expect(fil.querySelector('.reponses .message.reponse')?.textContent).toContain('Merci pour le partage');
    // Seuls les messages du membre connecté sont teintés.
    expect(fil.querySelector('.reponses .message.reponse')?.classList.contains('moi')).toBe(true);
    expect(fil.querySelectorAll('.message.moi')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('Votre réponse a été publiée.');
    expect(fixture.componentInstance.nombre()).toBe(2);
  });

  it('refuse un commentaire vide avant l’appel réseau', async () => {
    const fixture = TestBed.createComponent(CommentairesPublication);
    fixture.componentRef.setInput('publicationId', 'publication-2');
    fixture.componentRef.setInput('ouverte', true);
    fixture.detectChanges();
    http.expectOne((req) => req.method === 'GET').flush({ contenu: [], page: 0, taille: 20, totalElements: 0, totalPages: 0 });
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Saisissez un commentaire');
    http.expectNone((req) => req.method === 'POST');
  });

  it('publie avec Entrée, mais va à la ligne avec Maj+Entrée', async () => {
    const fixture = TestBed.createComponent(CommentairesPublication);
    fixture.componentRef.setInput('publicationId', 'publication-1');
    fixture.componentRef.setInput('ouverte', true);
    fixture.detectChanges();
    http.expectOne((req) => req.url === '/api/publications/publication-1/commentaires')
      .flush({ contenu: [], page: 0, taille: 20, totalElements: 0, totalPages: 0 });
    await fixture.whenStable();
    fixture.detectChanges();
    const saisie = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    saisie.value = 'Bravo';
    saisie.dispatchEvent(new Event('input'));
    const majEntree = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, cancelable: true });
    saisie.dispatchEvent(majEntree);
    expect(majEntree.defaultPrevented).toBe(false);
    http.expectNone('/api/publications/publication-1/commentaires');
    const entree = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    saisie.dispatchEvent(entree);
    expect(entree.defaultPrevented).toBe(true);
    const envoi = http.expectOne('/api/publications/publication-1/commentaires');
    expect(envoi.request.body).toEqual({ contenu: 'Bravo', parentId: undefined });
    envoi.flush(null, { status: 500, statusText: 'Erreur' });
  });
});
