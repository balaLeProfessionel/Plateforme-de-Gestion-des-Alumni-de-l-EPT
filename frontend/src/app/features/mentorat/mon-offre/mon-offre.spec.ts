import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomaineMentorat, ProfilMentor } from '../../../core/services/models/mentorat.model';
import { saisir, soumettre } from '../testing/donnees-mentorat';
import { MonOffre } from './mon-offre';

const DOMAINES: DomaineMentorat[] = ['A', 'B', 'C', 'D', 'E', 'F'].map((code) => ({
  id: `d${code}`, code, libelle: `Domaine ${code}`,
}));

describe('MonOffre', () => {
  let fixture: ComponentFixture<MonOffre>;
  let http: HttpTestingController;
  let racine: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MonOffre],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MonOffre);
    racine = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  async function charger(profil: ProfilMentor | null): Promise<void> {
    http.expectOne('/api/mentorat/domaines').flush(DOMAINES);
    const requete = http.expectOne('/api/mentorat/profil');
    if (profil) requete.flush(profil);
    else requete.flush({ message: 'introuvable' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const cases = () => [...racine.querySelectorAll('.choix input')] as HTMLInputElement[];
  const formulaire = () => racine.querySelector('form') as HTMLFormElement;

  it('affiche un squelette pendant le chargement', () => {
    expect(racine.querySelector('.squelette')).not.toBeNull();
    http.expectOne('/api/mentorat/domaines').flush([]);
    http.expectOne('/api/mentorat/profil').flush(null);
  });

  it('propose une offre vierge quand l’alumni n’en a pas encore', async () => {
    await charger(null);
    expect(racine.textContent).toContain('Proposez votre aide');
    expect(racine.querySelector('button[type="submit"]')?.textContent).toContain('Proposer mon mentorat');
    expect((racine.querySelector('#offre-capacite') as HTMLInputElement).value).toBe('3');
    expect(cases().every((caseDomaine) => !caseDomaine.checked)).toBe(true);
  });

  it('reprend l’offre existante et le nombre de mentorés', async () => {
    await charger({ id: 'p1', presentation: 'Data', disponible: false, capaciteMax: 4, mentoresActifs: 1,
      domaines: [DOMAINES[1]] });
    expect(racine.textContent).toContain('Vous accompagnez 1 / 4 mentorés.');
    expect(racine.querySelector('.interrupteur')?.textContent).toContain('Indisponible');
    expect(cases()[1].checked).toBe(true);
    expect(racine.querySelector('button[type="submit"]')?.textContent).toContain('Enregistrer');
  });

  it('exige au moins un domaine et au plus cinq, sans appeler le serveur', async () => {
    await charger(null);
    soumettre(formulaire());
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('#erreur-domaines')?.textContent).toContain('au moins un domaine');

    cases().forEach((caseDomaine) => caseDomaine.dispatchEvent(new Event('change')));
    fixture.detectChanges();
    expect(racine.querySelector('#erreur-domaines')?.textContent).toContain('au plus 5 domaines');
    soumettre(formulaire());
    await fixture.whenStable();
    http.expectNone('/api/mentorat/profil');
  });

  it('refuse une capacité hors de 1 à 10', async () => {
    await charger(null);
    saisir(racine.querySelector('#offre-capacite') as HTMLInputElement, '11');
    fixture.detectChanges();
    expect(racine.querySelector('#erreur-capacite')?.textContent).toContain('Au plus 10');
  });

  it('enregistre l’offre et confirme la disponibilité', async () => {
    await charger(null);
    cases()[0].dispatchEvent(new Event('change'));
    saisir(racine.querySelector('#offre-presentation') as HTMLTextAreaElement, '  Data engineer  ');
    fixture.detectChanges();
    soumettre(formulaire());
    await fixture.whenStable();

    const requete = http.expectOne((req) => req.method === 'PUT' && req.url === '/api/mentorat/profil');
    expect(requete.request.body).toEqual({
      disponible: true, capaciteMax: 3, domaineIds: ['dA'], presentation: 'Data engineer',
    });
    requete.flush({ id: 'p1', presentation: 'Data engineer', disponible: true, capaciteMax: 3, mentoresActifs: 0,
      domaines: [DOMAINES[0]] });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('.succes')?.textContent).toContain('les étudiants peuvent vous solliciter');
  });

  it('affiche le refus du serveur', async () => {
    await charger({ id: 'p1', presentation: null, disponible: true, capaciteMax: 3, mentoresActifs: 2,
      domaines: [DOMAINES[0]] });
    saisir(racine.querySelector('#offre-capacite') as HTMLInputElement, '1');
    soumettre(formulaire());
    await fixture.whenStable();
    http.expectOne((req) => req.method === 'PUT').flush(
      { message: 'Vous accompagnez déjà 2 mentorés : la capacité ne peut pas être inférieure.' },
      { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('déjà 2 mentorés');
  });
});
