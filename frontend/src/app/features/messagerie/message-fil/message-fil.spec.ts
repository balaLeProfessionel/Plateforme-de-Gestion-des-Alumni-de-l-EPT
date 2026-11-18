import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { Message } from '../../../core/services/models/messagerie.model';
import { simulerDialogue } from '../../../testing/dialogue';
import { MessageFil } from './message-fil';

registerLocaleData(localeFr);

const monMessage: Message = {
  id: 'm-1', auteurId: 'u-moi', auteurNom: 'Awa Diop', auteurPhoto: null, contenu: 'Bonjour',
  supprime: false, envoyeLe: '2026-11-14T09:30:00Z', deMoi: true, pieceJointe: null,
};

describe('MessageFil', () => {
  let fixture: ComponentFixture<MessageFil>;
  let http: HttpTestingController;

  beforeEach(async () => {
    simulerDialogue();
    await TestBed.configureTestingModule({
      imports: [MessageFil],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: LOCALE_ID, useValue: 'fr' }],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MessageFil);
    fixture.componentRef.setInput('message', monMessage);
    fixture.componentRef.setInput('conversationId', 'c-1');
    fixture.autoDetectChanges();
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
  });

  afterEach(() => fixture.nativeElement.remove());

  const racine = () => fixture.nativeElement as HTMLElement;
  const corbeille = () => racine().querySelector<HTMLButtonElement>('.ouvrir-suppression');

  it('ouvre une fenêtre modale avec le focus sur « Annuler », puis rend le focus à la corbeille', async () => {
    corbeille()?.click();
    await vi.waitFor(() => expect(document.activeElement?.textContent?.trim()).toBe('Annuler'));
    const dialogue = racine().querySelector<HTMLDialogElement>('dialog.confirmation');
    expect(dialogue?.open).toBe(true);
    expect(dialogue?.getAttribute('role')).toBe('alertdialog');
    expect(dialogue?.querySelector('h2')?.textContent).toBe('Supprimer ce message ?');

    racine().querySelector<HTMLButtonElement>('.confirmation .annuler')?.click();
    await vi.waitFor(() => expect(document.activeElement).toBe(corbeille()));
    expect(racine().querySelector('.confirmation')).toBeNull();
  });

  it('supprime le message après confirmation et le signale au fil', async () => {
    const supprime = vi.fn();
    fixture.componentInstance.supprime.subscribe(supprime);
    corbeille()?.click();
    await fixture.whenStable();
    racine().querySelector<HTMLButtonElement>('.confirmation .danger')?.click();

    const requete = http.expectOne('/api/messagerie/conversations/c-1/messages/m-1');
    expect(requete.request.method).toBe('DELETE');
    requete.flush(null);
    expect(supprime).toHaveBeenCalledWith('m-1');
  });
});
