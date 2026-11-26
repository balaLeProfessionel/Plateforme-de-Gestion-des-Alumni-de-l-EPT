import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { DialogueRecadragePublication } from './dialogue-recadrage-publication';

describe('DialogueRecadragePublication', () => {
  beforeEach(async () => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
    // Le recadreur lui-même a ses propres tests : ici, seule la fenêtre compte.
    TestBed.overrideComponent(DialogueRecadragePublication, { set: { imports: [], schemas: [NO_ERRORS_SCHEMA] } });
    await TestBed.configureTestingModule({ imports: [DialogueRecadragePublication] }).compileComponents();
  });

  it('s ouvre en fenêtre modale, signale l abandon et se ferme quand elle est retirée', async () => {
    const fixture = TestBed.createComponent(DialogueRecadragePublication);
    fixture.componentRef.setInput('image', new Image());
    await fixture.whenStable();
    const dialogue = (fixture.nativeElement as HTMLElement).querySelector('dialog') as HTMLDialogElement;
    expect(dialogue.open).toBe(true);
    expect(dialogue.getAttribute('aria-labelledby')).toBe('titre-recadrage-publication');

    const annulee = vi.fn();
    fixture.componentInstance.annulee.subscribe(annulee);
    (dialogue.querySelector('button[aria-label="Fermer le recadrage"]') as HTMLButtonElement).click();
    dialogue.dispatchEvent(new Event('cancel'));
    expect(annulee).toHaveBeenCalledTimes(2);

    fixture.destroy();
    expect(dialogue.open).toBe(false);
  });
});
