import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { uneOffreEmploi } from '../testing/donnees-offres-emploi';
import { FormulaireOffreRelayee } from './formulaire-offre-relayee';

/** Date au format des champs date, décalée de `jours`. */
function dans(jours: number): string {
  const date = new Date();
  date.setDate(date.getDate() + jours);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

describe('FormulaireOffreRelayee', () => {
  let fixture: ComponentFixture<FormulaireOffreRelayee>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  const afficher = (id = '') => {
    TestBed.configureTestingModule({
      imports: [FormulaireOffreRelayee],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(FormulaireOffreRelayee);
    fixture.detectChanges();
    http.expectOne('/api/public/filieres').flush([{ id: 'f1', nom: 'Génie informatique' }, { id: 'f2', nom: 'Génie civil' }]);
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
    saisir('offre-titre', ' Développeur Java ');
    saisir('offre-entreprise', 'Kër Data');
    saisir('offre-type', 'CDI');
    saisir('offre-lieu', 'Dakar');
    saisir('offre-expiration', dans(30));
    saisir('offre-lien', 'https://emplois.example.sn/42');
    saisir('offre-description', 'Maintenir le portail.');
  };
  const soumettre = async () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  afterEach(() => http.verify());

  it('refuse un formulaire incomplet, une date trop lointaine ou trop de compétences sans rien envoyer', async () => {
    const racine = afficher();
    await soumettre();
    http.expectNone('/api/offres-emploi/relayees');
    expect(racine.querySelector('#erreur-titre')?.textContent).toContain('Le titre est obligatoire.');
    expect(racine.querySelector('#erreur-lien')?.textContent).toContain('Le lien vers l’offre d’origine est obligatoire.');
    expect(document.activeElement?.id).toBe('offre-titre');

    remplir();
    saisir('offre-expiration', dans(200));
    saisir('offre-competences', Array.from({ length: 16 }, (_, i) => `C${i}`).join(', '));
    await soumettre();
    http.expectNone('/api/offres-emploi/relayees');
    expect(racine.querySelector('#erreur-expiration')?.textContent).toContain('6 mois au plus');
    expect(racine.querySelector('#erreur-competences')?.textContent).toContain('15 compétences au maximum.');
  });

  it('relaie l’offre avec ses compétences découpées et ses filières, puis ouvre sa page', async () => {
    const racine = afficher();
    remplir();
    saisir('offre-competences', 'Java, spring boot ; Java,  SQL ');
    const case2 = racine.querySelectorAll<HTMLInputElement>('.case input')[1];
    case2.checked = true;
    case2.dispatchEvent(new Event('change'));
    await soumettre();
    const requete = http.expectOne({ method: 'POST', url: '/api/offres-emploi/relayees' });
    expect(requete.request.body).toEqual({
      titre: 'Développeur Java', entreprise: 'Kër Data', typeContrat: 'CDI', lieu: 'Dakar', dateExpiration: dans(30),
      lienSource: 'https://emplois.example.sn/42', source: null, description: 'Maintenir le portail.',
      competences: ['Java', 'spring boot', 'SQL'], filieres: ['f2'],
    });
    requete.flush(uneOffreEmploi({ id: 'e9' }));
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/offres-emploi', 'e9']);
  });

  it('montre l’erreur du serveur sans quitter la page', async () => {
    const racine = afficher();
    remplir();
    await soumettre();
    http.expectOne('/api/offres-emploi/relayees').flush({ message: 'Adresse refusée.' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Adresse refusée.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('préremplit l’offre à modifier et l’enregistre par PUT', async () => {
    const racine = afficherModification();
    expect((racine.querySelector('#offre-titre') as HTMLInputElement).value).toBe('Développeur Java');
    expect((racine.querySelector('#offre-competences') as HTMLInputElement).value).toBe('Java, SQL');
    expect((racine.querySelectorAll<HTMLInputElement>('.case input')[0]).checked).toBe(true);
    saisir('offre-expiration', dans(60));
    await soumettre();
    const requete = http.expectOne({ method: 'PUT', url: '/api/offres-emploi/e1' });
    expect(requete.request.body.dateExpiration).toBe(dans(60));
    requete.flush(uneOffreEmploi());
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/offres-emploi', 'e1']);
  });

  function afficherModification(): HTMLElement {
    const racine = afficher('e1');
    http.expectOne('/api/offres-emploi/e1').flush(uneOffreEmploi({
      modifiable: true, dateExpiration: dans(10), filieres: [{ id: 'f1', nom: 'Génie informatique' }],
    }));
    fixture.detectChanges();
    return racine;
  }

  it('refuse de modifier une offre qui n’est plus modifiable', () => {
    const racine = afficher('e1');
    http.expectOne('/api/offres-emploi/e1').flush(uneOffreEmploi({ statut: 'RETIREE' }));
    fixture.detectChanges();
    expect(racine.querySelector('.etat')?.textContent).toContain('Cette offre ne peut plus être modifiée.');
    expect(racine.querySelector('form')).toBeNull();
  });
});
