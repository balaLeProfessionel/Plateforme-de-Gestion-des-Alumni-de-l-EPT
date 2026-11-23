import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { uneOffre } from '../testing/donnees-stages';
import { FormulaireOffre } from './formulaire-offre';

/** Date au format des champs date, décalée de `jours`. */
function dans(jours: number): string {
  const date = new Date();
  date.setDate(date.getDate() + jours);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

describe('FormulaireOffre', () => {
  let fixture: ComponentFixture<FormulaireOffre>;
  let http: HttpTestingController;

  const afficher = (administration = false) => {
    TestBed.configureTestingModule({
      imports: [FormulaireOffre],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { administration } } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FormulaireOffre);
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
    saisir('offre-titre', ' Développeur web ');
    saisir('offre-type', 'PFE');
    saisir('offre-duree', '4');
    saisir('offre-limite', dans(10));
    saisir('offre-description', 'Développer le portail.');
    saisir('offre-competences', 'Angular');
  };
  const soumettre = () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  };

  afterEach(() => http.verify());

  it('refuse un formulaire incomplet ou une date limite passée sans rien envoyer', () => {
    const racine = afficher();
    soumettre();
    http.expectNone('/api/stages/mes-offres');
    expect(racine.querySelector('#erreur-titre')?.textContent).toContain('Le titre est obligatoire.');
    expect(racine.querySelector('#erreur-type')?.textContent).toContain('Choisissez le type de stage.');
    expect(document.activeElement?.id).toBe('offre-titre');

    remplir();
    saisir('offre-limite', dans(-1));
    saisir('offre-duree', '30');
    soumettre();
    http.expectNone('/api/stages/mes-offres');
    expect(racine.querySelector('#erreur-limite')?.textContent).toContain('La date limite ne peut pas être passée.');
    expect(racine.querySelector('#erreur-duree')?.textContent).toContain('entre 1 et 24');
  });

  it('envoie l’offre de l’organisme et dit qu’elle attend la vérification de l’école', async () => {
    const racine = afficher();
    remplir();
    saisir('offre-lieu', 'Dakar');
    soumettre();
    const requete = http.expectOne({ method: 'POST', url: '/api/stages/mes-offres' });
    expect(requete.request.body).toEqual({
      titre: 'Développeur web', typeStage: 'PFE', dureeMois: 4, lieu: 'Dakar', dateDebutPrevue: null, nombrePlaces: null,
      dateLimiteCandidature: dans(10), description: 'Développer le portail.', competences: 'Angular',
    });
    requete.flush(uneOffre({ statut: 'SOUMISE' }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('.resultat h2')?.textContent).toContain('Offre transmise à l’école');
    expect(document.activeElement).toBe(racine.querySelector('.resultat'));
  });

  it('pour l’administration, exige l’organisme et reprend un organisme connu', async () => {
    const racine = afficher(true);
    expect(racine.querySelector('h1')?.textContent).toContain('Saisir une offre de stage');
    remplir();
    soumettre();
    expect(racine.querySelector('#erreur-organisme')?.textContent).toContain('Indiquez l’organisme.');

    saisir('offre-organisme', 'Kër');
    await new Promise((resolve) => setTimeout(resolve, 300));
    http.expectOne((r) => r.url === '/api/organisme/recherche').flush([{ id: 'org1', nom: 'Kër Data' }]);
    saisir('offre-organisme', 'kër data');
    expect(racine.querySelector('#aide-organisme')?.textContent).toContain('Organisme connu : Kër Data');
    await new Promise((resolve) => setTimeout(resolve, 300));
    http.match((r) => r.url === '/api/organisme/recherche').forEach((r) => r.flush([{ id: 'org1', nom: 'Kër Data' }]));
    fixture.detectChanges();
    soumettre();
    const requete = http.expectOne({ method: 'POST', url: '/api/admin/stages/offres' });
    expect(requete.request.body.organismeId).toBe('org1');
    expect(requete.request.body.nomNouvelOrganisme).toBeUndefined();
    requete.flush(uneOffre());
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('.resultat h2')?.textContent).toContain('Offre publiée');
  });

  it('joint les PDF choisis après la création de l’offre et signale celui qui échoue', async () => {
    const racine = afficher();
    remplir();
    const champ = racine.querySelector('#offre-pieces') as HTMLInputElement;
    const pdf = (nom: string) => new File(['%PDF-'], nom, { type: 'application/pdf' });
    Object.defineProperty(champ, 'files', {
      value: [pdf('fiche.pdf'), new File(['x'], 'image.png', { type: 'image/png' }), pdf('annexe.pdf')], configurable: true,
    });
    champ.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect([...racine.querySelectorAll('.pieces .nom')].map((n) => n.textContent)).toEqual(['fiche.pdf', 'annexe.pdf']);
    expect(racine.querySelector('.fichiers [role="alert"]')?.textContent).toContain('« image.png » n’est pas un PDF');

    soumettre();
    http.expectOne({ method: 'POST', url: '/api/stages/mes-offres' }).flush(uneOffre());
    await fixture.whenStable();
    http.expectOne({ method: 'POST', url: '/api/stages/offres/o1/pieces-jointes' }).flush(uneOffre());
    await fixture.whenStable();
    http.expectOne({ method: 'POST', url: '/api/stages/offres/o1/pieces-jointes' })
      .flush({ message: 'Le contenu du fichier n’est pas un PDF valide.' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('.echecs')?.textContent).toContain('« annexe.pdf » (Le contenu du fichier n’est pas un PDF valide.)');
    expect(racine.querySelector('.resultat h2')?.textContent).toContain('Offre publiée');
  });

  it('pour l’administration, crée un nouvel organisme à partir du nom saisi', () => {
    const racine = afficher(true);
    remplir();
    saisir('offre-organisme', 'Atelier Ndiaye');
    expect(racine.querySelector('#aide-organisme')?.textContent).toContain('Nouvel organisme');
    soumettre();
    const requete = http.expectOne({ method: 'POST', url: '/api/admin/stages/offres' });
    expect(requete.request.body.nomNouvelOrganisme).toBe('Atelier Ndiaye');
    requete.flush(uneOffre());
  });
});
