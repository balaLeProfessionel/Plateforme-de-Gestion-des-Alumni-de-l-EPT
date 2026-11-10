import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OffreStage } from '../../../core/services/models/stage.model';
import { uneOffre } from '../testing/donnees-stages';
import { MesOffres } from './mes-offres';

describe('MesOffres', () => {
  let fixture: ComponentFixture<MesOffres>;
  let http: HttpTestingController;

  const afficher = (offres: OffreStage[]) => {
    TestBed.configureTestingModule({ imports: [MesOffres], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MesOffres);
    fixture.detectChanges();
    http.expectOne('/api/stages/mes-offres').flush(offres);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (zone: HTMLElement, texte: string) =>
    [...zone.querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('liste les offres avec leur statut et le motif de l’école', () => {
    const racine = afficher([uneOffre(), uneOffre({ id: 'o2', titre: 'Refusée', statut: 'REFUSEE', motifDecision: 'Hors cursus' })]);
    const lignes = [...racine.querySelectorAll('.ligne')] as HTMLElement[];
    expect(lignes[0].querySelector('.statut')?.textContent).toBe('Publiée');
    expect(lignes[1].querySelector('.motif')?.textContent).toContain('Hors cursus');
    expect(bouton(lignes[1], 'Retirer')).toBeUndefined();
  });

  it('retire une offre après confirmation', () => {
    const racine = afficher([uneOffre()]);
    const ligne = racine.querySelector('.ligne') as HTMLElement;
    bouton(ligne, 'Retirer').click();
    fixture.detectChanges();
    expect(ligne.querySelector('.confirmation')?.textContent).toContain('Les étudiants ne la verront plus.');
    bouton(ligne, 'Retirer l’offre').click();
    http.expectOne({ method: 'PATCH', url: '/api/stages/mes-offres/o1/retirer' }).flush(uneOffre({ statut: 'RETIREE' }));
    fixture.detectChanges();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('est retirée');
    expect(racine.querySelector('.ligne .statut')?.textContent).toBe('Retirée');
  });

  it('invite à publier une première offre', () => {
    expect(afficher([]).querySelector('.etat h2')?.textContent).toContain('Aucune offre pour l’instant');
  });
});
