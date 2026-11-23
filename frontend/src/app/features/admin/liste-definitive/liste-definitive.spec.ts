import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { fournirFilieres } from '../../../core/services/filieres/filieres.testing';
import { CandidatureRecue, LigneListe, ListeDefinitive } from '../../../core/services/models/stage.model';
import { ListeDefinitivePage } from './liste-definitive';

const etudiant = (id: string, prenom: string) => ({ id, prenom, nom: 'Diop', filiere: 'Génie informatique', classe: 'DIC2', anneeEntree: 2022, urlPhoto: null });

function uneLigne(changement: Partial<LigneListe> = {}): LigneListe {
  return {
    id: 'l1', etudiant: etudiant('e-c1', 'Awa'), email: 'awa@example.sn', candidatureId: 'c1', avisOrganisme: 'RETENUE',
    statut: 'EN_PREPARATION', dateDebut: '2027-02-01', dateFin: '2027-05-31', motif: null, confirmeLe: null, annuleLe: null,
    ...changement,
  };
}

function uneListe(changement: Partial<ListeDefinitive> = {}): ListeDefinitive {
  return {
    offreId: 'o1', titreOffre: 'Développeur web', organisme: 'Kër Data', statutOffre: 'PUBLIEE', dateLimiteCandidature: '2020-01-01',
    nombrePlaces: 2, listePublieeLe: null, dateDebutParDefaut: '2027-02-01', dateFinParDefaut: '2027-05-31', lignes: [uneLigne()],
    ...changement,
  };
}

function uneCandidature(id: string, prenom: string, avis: CandidatureRecue['avisOrganisme']): CandidatureRecue {
  return {
    id, etudiant: etudiant('e-' + id, prenom), email: null, statut: 'ENVOYEE', avisOrganisme: avis, lettreMotivation: null,
    nomCv: 'cv.pdf', envoyeeLe: '2026-11-10T10:00:00Z', avisDonneLe: null,
  };
}

describe('ListeDefinitivePage', () => {
  let fixture: ComponentFixture<ListeDefinitivePage>;
  let http: HttpTestingController;

  const afficher = (liste: ListeDefinitive, candidatures: CandidatureRecue[] = []) => {
    TestBed.configureTestingModule({
      imports: [ListeDefinitivePage],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]), fournirFilieres(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'o1' }) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ListeDefinitivePage);
    fixture.detectChanges();
    http.expectOne('/api/admin/stages/offres/o1/liste').flush(liste);
    http.expectOne('/api/stages/offres/o1/candidatures').flush(candidatures);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (zone: Element, texte: string) =>
    [...zone.querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement;
  const cliquer = (zone: Element, texte: string) => {
    bouton(zone, texte).click();
    fixture.detectChanges();
  };

  afterEach(() => http.verify());

  it('présente le brouillon et propose les autres candidats, ceux que l’organisme retient d’abord', () => {
    const racine = afficher(uneListe(), [
      uneCandidature('c1', 'Awa', 'RETENUE'), uneCandidature('c2', 'Moussa', 'NON_RETENUE'), uneCandidature('c3', 'Fatou', 'RETENUE'),
    ]);
    expect(racine.querySelector('.bandeau')?.textContent).toContain('Brouillon');
    expect(racine.querySelector('app-ligne-liste h3')?.textContent).toContain('Awa Diop');
    expect(racine.querySelector('app-ligne-liste')?.textContent).toContain('avis de l’organisme : Retenue');
    expect(racine.querySelector('app-ligne-liste .details')?.textContent).toContain('DIC2 · Génie informatique');
    // Awa est déjà sur la liste : seuls Fatou (retenue) puis Moussa sont proposés.
    const candidats = [...racine.querySelectorAll('.candidats li .nom')].map((n) => n.textContent ?? '');
    expect(candidats).toHaveLength(2);
    expect(candidats[0]).toContain('Fatou');
    expect(candidats[1]).toContain('Moussa');

    cliquer(racine.querySelector('.candidats li') as Element, 'Ajouter');
    const ajout = http.expectOne({ method: 'POST', url: '/api/admin/stages/offres/o1/liste' });
    expect(ajout.request.body).toEqual({ etudiantId: 'e-c3', dateDebut: null, dateFin: null });
    ajout.flush(uneListe({ lignes: [uneLigne(), uneLigne({ id: 'l2', etudiant: etudiant('e-c3', 'Fatou') })] }));
    fixture.detectChanges();
    expect(racine.querySelectorAll('app-ligne-liste')).toHaveLength(2);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('Fatou Diop est ajouté à la liste.');
  });

  it('bloque la publication tant qu’un étudiant retenu n’a pas de dates', () => {
    const racine = afficher(uneListe({ lignes: [uneLigne({ dateDebut: null, dateFin: null })] }));
    const publier = bouton(racine, 'Publier la liste…');
    expect(publier.disabled).toBe(true);
    expect(racine.querySelector('#' + publier.getAttribute('aria-describedby'))?.textContent).toContain('pas encore de dates de stage');
  });

  it('publie la liste après confirmation et affiche l’erreur du serveur', () => {
    const racine = afficher(uneListe());
    cliquer(racine, 'Publier la liste…');
    expect(racine.querySelector('.zone')?.textContent).toContain('1 stage sera confirmé');
    cliquer(racine, 'Publier la liste');
    http.expectOne({ method: 'PATCH', url: '/api/admin/stages/offres/o1/liste/publier' })
      .flush({ message: 'Awa Diop a déjà un stage confirmé chez Sonatel : les dates se chevauchent.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(racine.querySelector('.zone [role="alert"]')?.textContent).toContain('les dates se chevauchent');

    cliquer(racine, 'Publier la liste');
    http.expectOne('/api/admin/stages/offres/o1/liste/publier').flush(uneListe({
      statutOffre: 'LISTE_PUBLIEE', listePublieeLe: '2026-12-20T10:00:00Z', lignes: [uneLigne({ statut: 'CONFIRME' })],
    }));
    fixture.detectChanges();
    expect(racine.querySelector('.bandeau.publie')?.textContent).toContain('Liste publiée le 20');
    expect(bouton(racine, 'Publier la liste')).toBeUndefined();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('chacun est prévenu par e-mail');
  });

  it('signale les dates manquantes avant la publication', () => {
    const racine = afficher(uneListe({ lignes: [uneLigne({ dateDebut: null, dateFin: null })] }));
    expect(racine.querySelector('.aide.alerte')?.textContent).toContain('1 étudiant n’a pas encore de dates');
    expect(racine.querySelector('.manque')?.textContent).toContain('Dates à renseigner');
  });

  it('exige un motif pour annuler un stage confirmé', () => {
    const racine = afficher(uneListe({ statutOffre: 'LISTE_PUBLIEE', listePublieeLe: '2026-12-20T10:00:00Z', lignes: [uneLigne({ statut: 'CONFIRME' })] }));
    const ligne = racine.querySelector('app-ligne-liste') as Element;
    cliquer(ligne, 'Annuler le stage…');
    cliquer(ligne, 'Annuler le stage');
    expect(ligne.querySelector('[role="alert"]')?.textContent).toContain('Indiquez le motif');

    const motif = ligne.querySelector('textarea') as HTMLTextAreaElement;
    motif.value = 'Stage reporté';
    motif.dispatchEvent(new Event('input'));
    cliquer(ligne, 'Annuler le stage');
    const requete = http.expectOne({ method: 'PATCH', url: '/api/admin/stages/liste/l1/retirer' });
    expect(requete.request.body).toEqual({ motif: 'Stage reporté' });
    requete.flush(uneListe({ statutOffre: 'LISTE_PUBLIEE', lignes: [uneLigne({ statut: 'ANNULE', motif: 'Stage reporté', annuleLe: '2026-12-21T10:00:00Z' })] }));
    fixture.detectChanges();
    expect(racine.querySelector('app-ligne-liste .statut')?.textContent).toBe('Annulé');
    expect(racine.querySelector('app-ligne-liste')?.textContent).toContain('motif : Stage reporté');
  });

  it('modifie les dates d’une ligne et refuse une fin avant le début', () => {
    const racine = afficher(uneListe());
    const ligne = racine.querySelector('app-ligne-liste') as Element;
    cliquer(ligne, 'Modifier les dates');
    const fin = ligne.querySelector('input[id^="fin-"]') as HTMLInputElement;
    fin.value = '2027-01-15';
    fin.dispatchEvent(new Event('input'));
    cliquer(ligne, 'Enregistrer les dates');
    expect(ligne.querySelector('[role="alert"]')?.textContent).toContain('ne peut pas précéder');

    fin.value = '2027-06-30';
    fin.dispatchEvent(new Event('input'));
    cliquer(ligne, 'Enregistrer les dates');
    const requete = http.expectOne({ method: 'PATCH', url: '/api/admin/stages/liste/l1/dates' });
    expect(requete.request.body).toEqual({ dateDebut: '2027-02-01', dateFin: '2027-06-30' });
    requete.flush(uneListe({ lignes: [uneLigne({ dateFin: '2027-06-30' })] }));
    fixture.detectChanges();
    expect(racine.querySelector('app-ligne-liste .periode')?.textContent).toMatch(/au 30 \S+ 2027/);
  });
});
