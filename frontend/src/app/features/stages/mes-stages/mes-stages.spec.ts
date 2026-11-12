import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MonStage } from '../../../core/services/models/stage.model';
import { MesStages } from './mes-stages';

function unStage(changement: Partial<MonStage> = {}): MonStage {
  return {
    id: 's1', offreId: 'o1', sujet: 'Développeur web', organisme: 'Kër Data', typeStage: 'PFE', lieu: 'Dakar',
    dateDebut: '2027-02-01', dateFin: '2027-05-31', confirmeLe: '2026-12-20T10:00:00Z', statut: 'CONFIRME', motif: null, declare: false,
    rapport: { dateLimite: null, nomFichier: null, deposeLe: null, etat: 'SANS_DATE', depotOuvert: false },
    ...changement,
  };
}

describe('MesStages', () => {
  let http: HttpTestingController;

  const afficher = (reponse: MonStage[] | 'erreur') => {
    TestBed.configureTestingModule({ imports: [MesStages], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MesStages);
    fixture.detectChanges();
    const requete = http.expectOne('/api/stages/mes-stages');
    if (reponse === 'erreur') requete.flush(null, { status: 500, statusText: 'Erreur' });
    else requete.flush(reponse);
    fixture.detectChanges();
    return { racine: fixture.nativeElement as HTMLElement, fixture };
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('montre chaque stage confirmé avec son organisme et ses dates', () => {
    const { racine } = afficher([unStage()]);
    expect(racine.querySelector('.stage a')?.getAttribute('href')).toBe('/stages/offres/o1');
    expect(racine.querySelector('.organisme')?.textContent).toContain('Kër Data · Dakar');
    expect(racine.querySelector('.periode')?.textContent).toMatch(/Du 1 \S+ 2027 au 31 \S+ 2027/);
    expect(racine.querySelector('.type')?.textContent).toBe('Projet de fin d’études');
    expect(racine.querySelector('.statut')).toBeNull();
    expect(racine.querySelector('a[href="/stages/declarer"]')).not.toBeNull();
  });

  it('montre une déclaration refusée avec le motif et retire une déclaration en attente', () => {
    const { racine, fixture } = afficher([
      unStage({ id: 'd1', offreId: null, sujet: 'Application mobile', statut: 'DECLARE', confirmeLe: null, declare: true }),
      unStage({ id: 'd2', offreId: null, statut: 'REFUSE', confirmeLe: null, motif: 'Convention impossible', declare: true }),
    ]);
    const cartes = racine.querySelectorAll('.stage');
    expect(cartes[0].querySelector('.statut')?.textContent).toBe('En attente de l’école');
    expect(cartes[0].querySelector('.origine')?.textContent).toBe('Trouvé par vous');
    expect(cartes[1].querySelector('.motif')?.textContent).toContain('Convention impossible');
    expect(cartes[1].querySelector('button')).toBeNull();

    bouton(racine, 'Retirer la déclaration').click();
    fixture.detectChanges();
    bouton(racine, 'Retirer').click();
    http.expectOne({ method: 'PATCH', url: '/api/stages/declarations/d1/retirer' }).flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    expect(racine.querySelectorAll('.stage')).toHaveLength(1);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('« Application mobile » est retirée');
  });

  it('explique quand un stage apparaîtra, et signale une erreur', () => {
    expect(afficher([]).racine.querySelector('.etat h2')?.textContent).toContain('Aucun stage');
    TestBed.resetTestingModule();
    expect(afficher('erreur').racine.querySelector('[role="alert"]')).not.toBeNull();
  });
});
