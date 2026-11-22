import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CandidatureMobilite } from '../../../core/services/models/mobilite.model';
import { etapesCandidature } from '../mes-candidatures-mobilite/mes-candidatures-mobilite';
import { uneOffreMobilite } from '../testing/donnees-mobilites';
import { CandidatureOffreMobilite } from './candidature-offre-mobilite';

function uneCandidature(changement: Partial<CandidatureMobilite> = {}): CandidatureMobilite {
  return {
    id: 'c1', statut: 'SOUMISE', rangAttente: null, soumiseLe: '2026-11-20T10:00:00Z', retireeLe: null, modifiable: true,
    offre: { id: 'm1', titre: 'Semestre d’échange', organisme: 'Université Laval', type: 'ECHANGE', periode: 'SEMESTRE_1', dureeSemaines: null,
      anneeUniversitaire: '2027-2028', dateLimite: '2027-03-15', candidaturesOuvertes: true, statut: 'PUBLIEE', piecesDemandees: ['LETTRE_MOTIVATION'] },
    pieces: [{ id: 'p1', type: 'LETTRE_MOTIVATION', nom: 'lettre.pdf', taille: 2048 }],
    ...changement,
  };
}

describe('CandidatureOffreMobilite', () => {
  let fixture: ComponentFixture<CandidatureOffreMobilite>;
  let http: HttpTestingController;

  const demarrer = (existante: CandidatureMobilite | null) => {
    TestBed.configureTestingModule({
      imports: [CandidatureOffreMobilite],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CandidatureOffreMobilite);
    fixture.componentRef.setInput('offre', uneOffreMobilite({ piecesDemandees: ['LETTRE_MOTIVATION', 'RELEVES_NOTES'] }));
    fixture.detectChanges();
    http.expectOne('/api/mobilites/offres/m1/ma-candidature').flush(existante);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const choisir = (racine: HTMLElement, type: string, nom: string) => {
    const champ = racine.querySelector(`#piece-${type}`) as HTMLInputElement;
    Object.defineProperty(champ, 'files', { value: [new File(['%PDF-1.4'], nom, { type: 'application/pdf' })], configurable: true });
    champ.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  const bouton = (racine: HTMLElement, debut: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith(debut)) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('n’envoie le dossier qu’avec toutes les pièces demandées, une partie par type', () => {
    const racine = demarrer(null);
    choisir(racine, 'LETTRE_MOTIVATION', 'lettre.pdf');
    bouton(racine, 'Envoyer ma candidature').click();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Il manque : relevés de notes.');
    http.expectNone('/api/mobilites/offres/m1/candidature');

    choisir(racine, 'RELEVES_NOTES', 'releves.pdf');
    bouton(racine, 'Envoyer ma candidature').click();
    const requete = http.expectOne('/api/mobilites/offres/m1/candidature');
    const contenu = requete.request.body as FormData;
    expect((contenu.get('LETTRE_MOTIVATION') as File).name).toBe('lettre.pdf');
    expect((contenu.get('RELEVES_NOTES') as File).name).toBe('releves.pdf');
    requete.flush(uneCandidature());
    fixture.detectChanges();
    expect(racine.querySelector('.message')?.textContent).toContain('Votre candidature est envoyée.');
  });

  it('demande confirmation avant de retirer une candidature envoyée', () => {
    const racine = demarrer(uneCandidature({ pieces: [
      { id: 'p1', type: 'LETTRE_MOTIVATION', nom: 'lettre.pdf', taille: 2048 }, { id: 'p2', type: 'RELEVES_NOTES', nom: 'r.pdf', taille: 10 }] }));
    expect(bouton(racine, 'Envoyer')).toBeUndefined();
    bouton(racine, 'Retirer ma candidature…').click();
    fixture.detectChanges();
    bouton(racine, 'Retirer ma candidature').click();
    http.expectOne('/api/mobilites/offres/m1/candidature/retirer').flush(uneCandidature({ statut: 'RETIREE' }));
    fixture.detectChanges();
    expect(bouton(racine, 'Renvoyer ma candidature')).toBeDefined();
  });
});

describe('etapesCandidature', () => {
  it('suit la candidature de l’envoi à la décision', () => {
    expect(etapesCandidature(uneCandidature()).map((e) => e.avancement)).toEqual(['fait', 'a-venir']);
    const close = uneCandidature({ offre: { ...uneCandidature().offre, candidaturesOuvertes: false } });
    expect(etapesCandidature(close)[1]).toEqual({ titre: 'Décision de l’école', etat: 'dossiers en cours d’examen', avancement: 'en-cours' });
    expect(etapesCandidature(uneCandidature({ statut: 'LISTE_ATTENTE', rangAttente: 2 }))[1].etat).toBe('liste d’attente, rang 2');
  });
});
