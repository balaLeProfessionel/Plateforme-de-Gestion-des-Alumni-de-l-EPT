import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { uneOffreGeree } from '../testing/donnees-offres-emploi';
import { FormulaireOffreGeree } from './formulaire-offre-geree';

/** Date au format des champs date, décalée de `jours`. */
function dans(jours: number): string {
  const date = new Date();
  date.setDate(date.getDate() + jours);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

describe('FormulaireOffreGeree', () => {
  let fixture: ComponentFixture<FormulaireOffreGeree>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  const afficher = (id = '') => {
    TestBed.configureTestingModule({
      imports: [FormulaireOffreGeree],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(FormulaireOffreGeree);
    fixture.detectChanges();
    http.expectOne('/api/public/filieres').flush([{ id: 'f1', nom: 'Génie informatique' }]);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const saisir = (id: string, valeur: string) => {
    const champ = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    champ.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  const remplir = () => {
    saisir('offre-titre', ' Ingénieur réseaux ');
    saisir('offre-type', 'CDI');
    saisir('offre-lieu', 'Dakar');
    saisir('offre-expiration', dans(30));
    saisir('offre-description', 'Exploiter le cœur de réseau.');
  };
  const soumettre = async () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const bouton = (texte: string) =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement | undefined;

  afterEach(() => http.verify());

  it('publie l’offre avec la lettre exigée et les questions, puis ouvre son détail', async () => {
    const racine = afficher();
    remplir();
    (racine.querySelector('.exigences input[type="checkbox"]') as HTMLInputElement).click();
    bouton('Ajouter une question')?.click();
    fixture.detectChanges();
    await soumettre();
    http.expectNone('/api/offres-emploi/gerees');
    expect(racine.querySelector('#erreur-question-0')?.textContent).toContain('Écrivez la question.');

    saisir('question-intitule-0', ' Avez-vous le permis ? ');
    saisir('question-type-0', 'OUI_NON');
    (racine.querySelector('.question input[type="checkbox"]') as HTMLInputElement).click();
    fixture.detectChanges();
    await soumettre();
    const requete = http.expectOne({ method: 'POST', url: '/api/offres-emploi/gerees' });
    expect(requete.request.body).toEqual(expect.objectContaining({
      titre: 'Ingénieur réseaux', typeContrat: 'CDI', lettreExigee: true,
      questions: [{ intitule: 'Avez-vous le permis ?', type: 'OUI_NON', obligatoire: true }],
    }));
    requete.flush(uneOffreGeree({ statut: 'PUBLIEE' }));
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/offres-emploi', 'g1']);
  });

  it('limite à 5 questions et en retire une', () => {
    const racine = afficher();
    for (let i = 0; i < 5; i++) {
      bouton('Ajouter une question')?.click();
      fixture.detectChanges();
    }
    expect(racine.querySelectorAll('.question').length).toBe(5);
    expect(bouton('Ajouter une question')).toBeUndefined();
    (racine.querySelector('[aria-label="Retirer la question 2"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine.querySelectorAll('.question').length).toBe(4);
    expect(bouton('Ajouter une question')).toBeTruthy();
  });

  it('annonce que l’offre attend la vérification de l’école quand l’organisme n’est pas encore validé', async () => {
    const racine = afficher();
    remplir();
    await soumettre();
    http.expectOne({ method: 'POST', url: '/api/offres-emploi/gerees' }).flush(uneOffreGeree({ statut: 'SOUMISE' }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('#titre-resultat')?.textContent).toContain('Offre transmise à l’école');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('recharge une offre gérée à modifier et affiche le refus du serveur', async () => {
    const racine = afficher('g1');
    http.expectOne('/api/offres-emploi/g1').flush(uneOffreGeree({
      modifiable: true, lettreExigee: true, questions: [{ id: 'q1', intitule: 'Disponibilité ?', type: 'TEXTE', obligatoire: true }],
    }));
    fixture.detectChanges();
    expect((racine.querySelector('#offre-titre') as HTMLInputElement).value).toBe('Ingénieur réseaux');
    expect((racine.querySelector('#question-intitule-0') as HTMLInputElement).value).toBe('Disponibilité ?');

    saisir('question-intitule-0', 'Date de disponibilité ?');
    await soumettre();
    http.expectOne({ method: 'PUT', url: '/api/offres-emploi/g1/geree' })
      .flush({ message: 'Des candidats ont déjà répondu : les questions ne peuvent plus changer.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('.message-erreur')?.textContent).toContain('les questions ne peuvent plus changer');
  });

  it('refuse de modifier une offre relayée', () => {
    const racine = afficher('e1');
    http.expectOne('/api/offres-emploi/e1').flush(uneOffreGeree({ id: 'e1', mode: 'RELAYEE', modifiable: true }));
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Cette offre ne peut plus être modifiée.');
  });
});
