import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { uneOffreMobilite } from '../testing/donnees-mobilites';
import { FormulaireOffreMobilite } from './formulaire-offre-mobilite';

describe('FormulaireOffreMobilite', () => {
  let fixture: ComponentFixture<FormulaireOffreMobilite>;
  let http: HttpTestingController;

  const demarrer = (data: Record<string, unknown> = {}) => {
    TestBed.configureTestingModule({
      imports: [FormulaireOffreMobilite],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data, paramMap: convertToParamMap({}) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FormulaireOffreMobilite);
    fixture.detectChanges();
    http.expectOne('/api/public/filieres').flush([{ id: 'f1', nom: 'Génie civil' }]);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const saisir = (racine: HTMLElement, id: string, valeur: string) => {
    const champ = racine.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    champ.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  const remplir = (racine: HTMLElement) => {
    saisir(racine, 'offre-titre', 'Semestre d’échange');
    saisir(racine, 'offre-type', 'ECHANGE');
    saisir(racine, 'offre-public', 'ETUDIANTS');
    saisir(racine, 'offre-pays', 'Canada');
    saisir(racine, 'offre-periode', 'SEMESTRE_1');
    saisir(racine, 'offre-places', '3');
    saisir(racine, 'offre-limite', '2099-03-15');
    saisir(racine, 'offre-description', 'Cours en génie logiciel');
  };

  afterEach(() => http.verify());

  it('refuse un double diplôme ouvert aux enseignants avant tout envoi', () => {
    const racine = demarrer();
    remplir(racine);
    saisir(racine, 'offre-type', 'DOUBLE_DIPLOME');
    saisir(racine, 'offre-public', 'ENSEIGNANTS');
    (racine.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(racine.querySelector('#erreur-public')?.textContent).toContain('Un double diplôme s’adresse aux étudiants.');
    http.expectNone('/api/mobilites/mes-offres');
  });

  it('demande la durée d’un séjour, puis envoie l’offre avec les filières et pièces cochées', async () => {
    const racine = demarrer();
    remplir(racine);
    saisir(racine, 'offre-periode', 'SEJOUR');
    (racine.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(racine.querySelector('#erreur-duree')?.textContent).toContain('Indiquez la durée du séjour en semaines.');

    saisir(racine, 'offre-duree', '6');
    const filiere = [...racine.querySelectorAll('.cases label')].find((l) => l.textContent?.includes('Génie civil'))?.querySelector('input');
    filiere?.click();
    fixture.detectChanges();
    (racine.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    const requete = http.expectOne('/api/mobilites/mes-offres');
    expect(requete.request.body).toEqual(expect.objectContaining({
      type: 'ECHANGE', publicVise: 'ETUDIANTS', periode: 'SEJOUR', dureeSemaines: 6, nombrePlaces: 3, filiereIds: ['f1'],
      piecesDemandees: ['LETTRE_MOTIVATION', 'RELEVES_NOTES'],
    }));
    requete.flush(uneOffreMobilite());
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('#titre-resultat')?.textContent).toContain('Offre publiée');
  });
});
