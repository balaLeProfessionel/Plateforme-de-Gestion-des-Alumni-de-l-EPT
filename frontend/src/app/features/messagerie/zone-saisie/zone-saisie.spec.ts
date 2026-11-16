import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { Message } from '../../../core/services/models/messagerie.model';
import { ZoneSaisie } from './zone-saisie';

describe('ZoneSaisie', () => {
  let fixture: ComponentFixture<ZoneSaisie>;
  let http: HttpTestingController;
  let champ: HTMLTextAreaElement;
  let bouton: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneSaisie],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ZoneSaisie);
    fixture.componentRef.setInput('conversationId', 'c-1');
    fixture.detectChanges();
    champ = (fixture.nativeElement as HTMLElement).querySelector('textarea') as HTMLTextAreaElement;
    bouton = (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]') as HTMLButtonElement;
  });

  afterEach(() => http.verify());

  function saisir(texte: string): void {
    champ.value = texte;
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('n’envoie pas un message vide', () => {
    expect(bouton.disabled).toBe(true);
    saisir('    ');
    expect(bouton.disabled).toBe(true);
    champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    http.expectNone('/api/messagerie/conversations/c-1/messages');
  });

  it('envoie le texte nettoyé avec Entrée, vide le champ et prévient le fil', async () => {
    const envoye = vi.fn();
    fixture.componentInstance.envoye.subscribe(envoye);
    saisir('  Bonjour Moussa  ');
    expect(bouton.disabled).toBe(false);

    champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    const requete = http.expectOne('/api/messagerie/conversations/c-1/messages');
    expect(requete.request.body).toEqual({ contenu: 'Bonjour Moussa' });
    const reponse = { id: 'm-1', contenu: 'Bonjour Moussa' } as Message;
    requete.flush(reponse);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(envoye).toHaveBeenCalledWith(reponse);
    expect(champ.value).toBe('');
  });

  it('va à la ligne avec Maj + Entrée sans envoyer', () => {
    saisir('Première ligne');
    champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
    http.expectNone('/api/messagerie/conversations/c-1/messages');
  });

  it('garde le texte et affiche l’erreur quand l’envoi échoue', async () => {
    saisir('Bonjour');
    bouton.click();
    http.expectOne('/api/messagerie/conversations/c-1/messages')
      .flush({ message: 'Cette conversation est introuvable.' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent)
      .toContain('Cette conversation est introuvable.');
    expect(champ.value).toBe('Bonjour');
  });

  function choisir(fichier: File): void {
    const selecteur = (fixture.nativeElement as HTMLElement).querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(selecteur, 'files', { configurable: true, value: { 0: fichier, length: 1, item: () => fichier } });
    selecteur.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('envoie un fichier seul en multipart, puis retire la pastille', async () => {
    choisir(new File(['%PDF-1.7'], 'Programme.pdf', { type: 'application/pdf' }));
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('.fichier-choisi')?.textContent).toContain('Programme.pdf');
    expect(bouton.disabled).toBe(false);

    bouton.click();
    const requete = http.expectOne('/api/messagerie/conversations/c-1/messages');
    const corps = requete.request.body as FormData;
    expect((corps.get('fichier') as File).name).toBe('Programme.pdf');
    expect(corps.has('contenu')).toBe(false);
    requete.flush({ id: 'm-1', contenu: '' } as Message);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(racine.querySelector('.fichier-choisi')).toBeNull();
    expect(bouton.disabled).toBe(true);
  });

  it('refuse aussitôt un type de fichier non accepté', () => {
    choisir(new File(['MZ'], 'outil.exe'));
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('n’est pas accepté');
    expect(racine.querySelector('.fichier-choisi')).toBeNull();
    expect(bouton.disabled).toBe(true);
  });

  it('retire le fichier choisi et rend le focus au trombone', () => {
    choisir(new File(['Bonjour'], 'notes.txt', { type: 'text/plain' }));
    const racine = fixture.nativeElement as HTMLElement;
    (racine.querySelector('.retirer') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(racine.querySelector('.fichier-choisi')).toBeNull();
    expect(document.activeElement).toBe(racine.querySelector('.joindre'));
  });
});
