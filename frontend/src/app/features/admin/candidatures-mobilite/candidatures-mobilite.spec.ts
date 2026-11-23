import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { CandidaturesOffre, DossierMobilite } from '../../../core/services/models/mobilite.model';
import { CandidaturesMobilite } from './candidatures-mobilite';

function unDossier(changement: Partial<DossierMobilite> = {}): DossierMobilite {
  return {
    id: 'c1', candidat: { id: 'e1', prenom: 'Awa', nom: 'Ndiaye', role: 'ETUDIANT', filiere: 'GIT', classe: 'DIC2' }, statut: 'SOUMISE',
    rangAttente: null, soumiseLe: '2027-03-01T10:00:00Z', pieces: [{ id: 'p1', type: 'LETTRE_MOTIVATION', nom: 'l.pdf', taille: 10 }],
    retenuAilleurs: null, ...changement,
  };
}

function desCandidatures(changement: Partial<CandidaturesOffre> = {}, offre: Partial<CandidaturesOffre['offre']> = {}): CandidaturesOffre {
  return {
    offre: { id: 'm1', titre: 'Semestre d’échange', organisme: 'Université Laval', statut: 'CLOTUREE', nombrePlaces: 1, dateLimite: '2027-03-15',
      anneeUniversitaire: '2027-2028', periode: 'SEMESTRE_1', dureeSemaines: null, decisionsOuvertes: true, listePublieeLe: null, ...offre },
    dossiers: [unDossier()], retenues: 0, enAttente: 0, sansDecision: 1, blocagePublication: '1 dossier n’a pas encore de décision.', ...changement,
  };
}

describe('CandidaturesMobilite', () => {
  let fixture: ComponentFixture<CandidaturesMobilite>;
  let http: HttpTestingController;

  const demarrer = (donnees: CandidaturesOffre) => {
    TestBed.configureTestingModule({
      imports: [CandidaturesMobilite],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'm1' }) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CandidaturesMobilite);
    fixture.detectChanges();
    http.expectOne('/api/admin/mobilites/offres/m1/candidatures').flush(donnees);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('bloque la publication tant qu’un dossier est sans décision, puis la publie après confirmation', () => {
    const racine = demarrer(desCandidatures());
    expect(bouton(racine, 'Publier la liste…').disabled).toBe(true);
    expect(racine.querySelector('#blocage-publication')?.textContent).toContain('1 dossier');

    const choix = racine.querySelector('#decision-c1') as HTMLSelectElement;
    choix.value = 'RETENUE';
    choix.dispatchEvent(new Event('change'));
    const decision = http.expectOne('/api/admin/mobilites/candidatures/c1/decision');
    expect(decision.request.body).toEqual({ statut: 'RETENUE', rang: null });
    decision.flush(desCandidatures({ dossiers: [unDossier({ statut: 'RETENUE' })], retenues: 1, sansDecision: 0, blocagePublication: null }));
    fixture.detectChanges();

    bouton(racine, 'Publier la liste…').click();
    fixture.detectChanges();
    bouton(racine, 'Publier la liste').click();
    http.expectOne('/api/admin/mobilites/offres/m1/liste/publier')
      .flush(desCandidatures({ dossiers: [unDossier({ statut: 'RETENUE' })], retenues: 1, sansDecision: 0, blocagePublication: null },
        { statut: 'LISTE_PUBLIEE', listePublieeLe: '2027-03-20T10:00:00Z' }));
    fixture.detectChanges();
    expect(racine.querySelector('.publiee')?.textContent).toContain('Liste publiée');
    expect(racine.querySelector('#decision-c1')).toBeNull();
  });

  it('signale un candidat déjà retenu ailleurs et propose la place libérée au suivant', () => {
    const racine = demarrer(desCandidatures({
      dossiers: [unDossier({ statut: 'LISTE_ATTENTE', rangAttente: 1, retenuAilleurs: 'INSA Lyon — Double diplôme' })],
      retenues: 0, enAttente: 1, sansDecision: 0, blocagePublication: null,
    }, { statut: 'LISTE_PUBLIEE', listePublieeLe: '2027-03-20T10:00:00Z' }));
    expect(racine.querySelector('.avertissement')?.textContent).toContain('INSA Lyon — Double diplôme');
    bouton(racine, 'Donner la place libre').click();
    http.expectOne('/api/admin/mobilites/candidatures/c1/promouvoir').flush(desCandidatures(
      { dossiers: [unDossier({ statut: 'RETENUE' })], retenues: 1, sansDecision: 0, blocagePublication: null }, { statut: 'LISTE_PUBLIEE' }));
    fixture.detectChanges();
    expect(racine.querySelector('.message')?.textContent).toContain('Awa Ndiaye prend la place libre');
  });
});
