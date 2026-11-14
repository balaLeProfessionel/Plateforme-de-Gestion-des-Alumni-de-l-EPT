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
});
