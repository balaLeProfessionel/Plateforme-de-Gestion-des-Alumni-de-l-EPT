import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PieceJointe } from '../../../core/services/models/messagerie.model';
import { simulerDialogue } from '../../../testing/dialogue';
import { PieceJointeMessage } from './piece-jointe-message';

const ADRESSE = '/api/messagerie/conversations/c-1/messages/m-1/piece-jointe';

describe('PieceJointeMessage', () => {
  let fixture: ComponentFixture<PieceJointeMessage>;
  let http: HttpTestingController;
  const creer = vi.fn(() => 'blob:local/1');
  const revoquer = vi.fn();

  beforeEach(async () => {
    creer.mockClear();
    revoquer.mockClear();
    // jsdom ne fournit pas les adresses `blob:`.
    Object.assign(URL, { createObjectURL: creer, revokeObjectURL: revoquer });
    await TestBed.configureTestingModule({
      imports: [PieceJointeMessage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function afficher(piece: PieceJointe): HTMLElement {
    fixture = TestBed.createComponent(PieceJointeMessage);
    fixture.componentRef.setInput('conversationId', 'c-1');
    fixture.componentRef.setInput('messageId', 'm-1');
    fixture.componentRef.setInput('pieceJointe', piece);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('charge une image avec le jeton et l’affiche avec un texte alternatif, puis libère l’adresse', () => {
    const racine = afficher({ nom: 'photo.png', type: 'image/png', taille: 2048, image: true });
    const requete = http.expectOne(ADRESSE);
    expect(requete.request.responseType).toBe('blob');
    requete.flush(new Blob(['png']));
    fixture.detectChanges();

    const image = racine.querySelector('img') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('blob:local/1');
    expect(image.alt).toBe('Image jointe : photo.png');
    fixture.destroy();
    expect(revoquer).toHaveBeenCalledWith('blob:local/1');
  });

  it('ouvre la photo en grand au clic, puis rend le focus à la miniature', async () => {
    simulerDialogue();
    const racine = afficher({ nom: 'photo.png', type: 'image/png', taille: 2048, image: true });
    document.body.appendChild(racine);
    try {
      http.expectOne(ADRESSE).flush(new Blob(['png']));
      fixture.detectChanges();
      const miniature = racine.querySelector<HTMLButtonElement>('.apercu')!;
      expect(miniature.getAttribute('aria-label')).toBe('Agrandir l’image photo.png');

      miniature.click();
      await fixture.whenStable();
      const visionneuse = racine.querySelector<HTMLDialogElement>('app-visionneuse-image dialog')!;
      expect(visionneuse.open).toBe(true);
      expect(visionneuse.querySelector('img')?.getAttribute('src')).toBe('blob:local/1');
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Fermer');

      visionneuse.querySelector<HTMLButtonElement>('.fermer')!.click();
      await fixture.whenStable();
      await vi.waitFor(() => expect(document.activeElement).toBe(racine.querySelector('.apercu')));
      expect(racine.querySelector('app-visionneuse-image')).toBeNull();
    } finally {
      racine.remove();
    }
  });

  it('propose un autre fichier au téléchargement sans le charger d’avance', () => {
    const racine = afficher({ nom: 'Programme.pdf', type: 'application/pdf', taille: 3 * 1024 * 1024, image: false });
    http.expectNone(ADRESSE);
    const bouton = racine.querySelector('button') as HTMLButtonElement;
    expect(bouton.getAttribute('aria-label')).toBe('Télécharger Programme.pdf, 3 Mo');

    bouton.click();
    http.expectOne(ADRESSE).flush(new Blob(['%PDF']));
    expect(creer).toHaveBeenCalled();
  });

  it('dit quand le fichier n’a pas pu être téléchargé', () => {
    const racine = afficher({ nom: 'Programme.pdf', type: 'application/pdf', taille: 100, image: false });
    (racine.querySelector('button') as HTMLButtonElement).click();
    http.expectOne(ADRESSE).flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('n’a pas pu être téléchargé');
  });
});
