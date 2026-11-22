import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OffreStage } from '../../../core/services/models/stage.model';
import { uneOffre } from '../testing/donnees-stages';
import { FichiersOffre } from './fichiers-offre';

describe('FichiersOffre', () => {
  let fixture: ComponentFixture<FichiersOffre>;
  let http: HttpTestingController;
  const piece = { id: 'p1', nom: 'Fiche de poste.pdf', taille: 240_000 };

  const afficher = (offre: OffreStage) => {
    TestBed.configureTestingModule({ imports: [FichiersOffre], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FichiersOffre);
    fixture.componentRef.setInput('offre', offre);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const choisir = (racine: HTMLElement, id: string, fichier: File) => {
    const champ = racine.querySelector(`#${id}`) as HTMLInputElement;
    Object.defineProperty(champ, 'files', { value: [fichier], configurable: true });
    champ.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  afterEach(() => http.verify());

  it('n’affiche rien pour un lecteur quand l’offre n’a pas de document', () => {
    expect(afficher(uneOffre()).querySelector('section')).toBeNull();
  });

  it('liste les documents et les télécharge avec le jeton, sans proposer de les retirer à un lecteur', () => {
    const racine = afficher(uneOffre({ piecesJointes: [piece] }));
    expect(racine.querySelector('.pieces li')?.textContent).toContain('PDF, 234 Ko');
    expect(racine.querySelector('.retirer')).toBeNull();
    expect(racine.querySelector('.gestion')).toBeNull();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    (racine.querySelector('.lien') as HTMLButtonElement).click();
    const requete = http.expectOne('/api/stages/offres/o1/pieces-jointes/p1');
    expect(requete.request.responseType).toBe('blob');
    requete.flush(new Blob(['%PDF-'], { type: 'application/pdf' }));
    expect(clic).toHaveBeenCalled();
    clic.mockRestore();
  });

  it('pour l’organisme, joint un PDF, refuse un autre format et retire un document', () => {
    const racine = afficher(uneOffre({ modifiable: true, piecesJointes: [piece] }));
    const modifiees: OffreStage[] = [];
    fixture.componentInstance.modifiee.subscribe((o) => modifiees.push(o));

    choisir(racine, 'ajout-piece-offre', new File(['x'], 'note.docx', { type: 'application/msword' }));
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Seuls les fichiers PDF');
    http.expectNone('/api/stages/offres/o1/pieces-jointes');

    choisir(racine, 'ajout-piece-offre', new File(['%PDF-'], 'annexe.pdf', { type: 'application/pdf' }));
    const envoi = http.expectOne({ method: 'POST', url: '/api/stages/offres/o1/pieces-jointes' });
    expect((envoi.request.body as FormData).get('fichier')).toBeInstanceOf(File);
    envoi.flush(uneOffre({ modifiable: true, piecesJointes: [piece, { id: 'p2', nom: 'annexe.pdf', taille: 5 }] }));
    fixture.detectChanges();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('« annexe.pdf » est jointe');
    expect(modifiees).toHaveLength(1);

    (racine.querySelector('.retirer') as HTMLButtonElement).click();
    http.expectOne({ method: 'DELETE', url: '/api/stages/offres/o1/pieces-jointes/p1' }).flush(uneOffre({ modifiable: true }));
    expect(modifiees).toHaveLength(2);
  });

  it('retire l’image et ne propose plus d’ajout au-delà de trois documents', () => {
    const trois = [piece, { ...piece, id: 'p2' }, { ...piece, id: 'p3' }];
    const racine = afficher(uneOffre({ modifiable: true, urlImage: '/api/offre-images/a.jpg', piecesJointes: trois }));
    expect(racine.querySelector('#ajout-piece-offre')).toBeNull();
    expect(racine.querySelector('label[for="image-offre"]')?.textContent).toContain('Changer l’image');
    ([...racine.querySelectorAll('button')].find((b) => b.textContent?.includes('Retirer l’image')) as HTMLButtonElement).click();
    http.expectOne({ method: 'DELETE', url: '/api/stages/offres/o1/image' }).flush(uneOffre({ modifiable: true }));
  });
});
