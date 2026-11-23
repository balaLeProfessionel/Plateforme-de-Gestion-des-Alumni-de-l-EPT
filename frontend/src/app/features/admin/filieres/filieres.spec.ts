import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth-service';
import { FiliereAdmin } from '../../../core/services/models/filiere.model';
import { authAdmin } from '../testing/donnees-admin';
import { Filieres } from './filieres';

const civil: FiliereAdmin = { id: 'f-civil', nom: 'Génie Civil', active: true, nombreComptes: 33, chef: null };
const doublon: FiliereAdmin = { id: 'f-info', nom: 'Informatique et télécommunications', active: true, nombreComptes: 2, chef: null };
const git: FiliereAdmin = {
  id: 'f-git', nom: 'Génie Informatique et Télécommunications', active: true, nombreComptes: 48,
  chef: { id: 'p1', prenom: 'Ousmane', nom: 'Badji', designeLe: '2026-11-02T10:00:00Z' },
};
const petrole: FiliereAdmin = { id: 'f-petrole', nom: 'Pétrole et gaz', active: false, nombreComptes: 1, chef: null };

describe('Filieres', () => {
  let fixture: ComponentFixture<Filieres>;
  let http: HttpTestingController;

  const afficher = async (auth = authAdmin(), liste: FiliereAdmin[] = [civil, doublon, git, petrole]) => {
    TestBed.configureTestingModule({
      imports: [Filieres],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Filieres);
    fixture.detectChanges();
    http.expectOne('/api/admin/filieres').flush(liste);
    if (auth.aPermission('GERER_ADMINISTRATEURS')) {
      http.expectOne('/api/admin/filieres/chefs-possibles').flush([
        { id: 'p1', prenom: 'Ousmane', nom: 'Badji', email: 'obadji@ept.sn' },
        { id: 'p2', prenom: 'Rokhaya', nom: 'Gaye', email: 'rgaye@ept.sn' },
      ]);
    }
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const carte = (racine: HTMLElement, nom: string) =>
    [...racine.querySelectorAll<HTMLElement>('.filiere')].find((c) => c.querySelector('h2')?.textContent?.trim() === nom) as HTMLElement;
  const bouton = (zone: HTMLElement, texte: string) =>
    [...zone.querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement;
  const choisir = (zone: HTMLElement, valeur: string) => {
    const liste = zone.querySelector('select') as HTMLSelectElement;
    liste.value = valeur;
    liste.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  const soumettre = async (zone: HTMLElement) => {
    (zone.matches('form') ? zone : zone.querySelector('form'))?.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const relire = async (liste: FiliereAdmin[]) => {
    http.expectOne({ method: 'GET', url: '/api/admin/filieres' }).flush(liste);
    http.match('/api/public/filieres').forEach((r) => r.flush([]));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  afterEach(() => http.verify());

  it('liste les filières avec leurs comptes, leur chef et celles retirées', async () => {
    const racine = await afficher();
    expect(racine.querySelector('.resume')?.textContent).toContain('4 filières, dont 3 proposées');
    expect(carte(racine, 'Génie Informatique et Télécommunications').textContent).toContain('Ousmane Badji');
    expect(carte(racine, 'Génie Civil').textContent).toContain('Aucun');
    expect(carte(racine, 'Pétrole et gaz').querySelector('.pastille')?.textContent).toBe('Retirée');
    expect(bouton(carte(racine, 'Pétrole et gaz'), 'Proposer de nouveau')).toBeDefined();
  });

  it('refuse un nom vide, puis ajoute la filière et annonce le résultat', async () => {
    const racine = await afficher();
    const formulaire = racine.querySelector('form.ajout') as HTMLElement;
    await soumettre(formulaire);
    http.expectNone('/api/admin/filieres', 'POST');
    expect(racine.querySelector('#erreur-nouvelle-filiere')?.textContent).toContain('Indiquez le nom de la filière.');

    const champ = racine.querySelector('#nouvelle-filiere') as HTMLInputElement;
    champ.value = 'Génie Chimique';
    champ.dispatchEvent(new Event('input'));
    await soumettre(formulaire);
    const requete = http.expectOne({ method: 'POST', url: '/api/admin/filieres' });
    expect(requete.request.body).toEqual({ nom: 'Génie Chimique' });
    requete.flush({ id: 'f-chimie', nom: 'Génie Chimique', active: true, nombreComptes: 0, chef: null });
    await relire([civil, { id: 'f-chimie', nom: 'Génie Chimique', active: true, nombreComptes: 0, chef: null }]);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('« Génie Chimique » est ajoutée');
    expect(champ.value).toBe('');
  });

  it('montre l’erreur du serveur pour un doublon', async () => {
    const racine = await afficher();
    const champ = racine.querySelector('#nouvelle-filiere') as HTMLInputElement;
    champ.value = 'genie civil';
    champ.dispatchEvent(new Event('input'));
    await soumettre(racine.querySelector('form.ajout') as HTMLElement);
    http.expectOne({ method: 'POST', url: '/api/admin/filieres' })
      .flush({ message: 'La filière « Génie Civil » existe déjà.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(racine.querySelector('form.ajout [role="alert"]')?.textContent).toContain('existe déjà');
  });

  it('fusionne un doublon après avoir dit combien de comptes passent dans quelle filière', async () => {
    const racine = await afficher();
    const zone = carte(racine, 'Informatique et télécommunications');
    bouton(zone, 'Fusionner').click();
    fixture.detectChanges();
    await soumettre(zone);
    http.expectNone('/api/admin/filieres/f-info/fusion');
    expect(zone.querySelector('[role="alert"]')?.textContent).toContain('Choisissez la filière qui reçoit les comptes.');

    choisir(zone, 'f-git');
    expect(zone.querySelector('.aide.alerte')?.textContent).toContain(
      'Les 2 compte(s) de « Informatique et télécommunications » passeront dans « Génie Informatique et Télécommunications »');
    await soumettre(zone);
    const requete = http.expectOne({ method: 'POST', url: '/api/admin/filieres/f-info/fusion' });
    expect(requete.request.body).toEqual({ cibleId: 'f-git' });
    requete.flush({ ...git, nombreComptes: 50 });
    await relire([civil, { ...git, nombreComptes: 50 }, petrole]);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('qui compte désormais 50 comptes');
  });

  it('retire une filière sans confirmation, puisque l’action se défait', async () => {
    const racine = await afficher();
    bouton(carte(racine, 'Génie Civil'), 'Retirer').click();
    http.expectOne({ method: 'PATCH', url: '/api/admin/filieres/f-civil/retirer' }).flush({ ...civil, active: false });
    await relire([{ ...civil, active: false }]);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('n’est plus proposée. Les comptes qui l’ont la gardent.');
  });

  it('laisse le super administrateur désigner un chef parmi le personnel', async () => {
    const racine = await afficher();
    const zone = carte(racine, 'Génie Civil');
    bouton(zone, 'Désigner le chef').click();
    fixture.detectChanges();
    expect([...zone.querySelectorAll('option')].map((o) => o.textContent?.trim())).toContain('Rokhaya Gaye (rgaye@ept.sn)');
    choisir(zone, 'p2');
    await soumettre(zone);
    const requete = http.expectOne({ method: 'PUT', url: '/api/admin/filieres/f-civil/chef' });
    expect(requete.request.body).toEqual({ chefId: 'p2' });
    requete.flush({ ...civil, chef: { id: 'p2', prenom: 'Rokhaya', nom: 'Gaye', designeLe: '2026-11-10T09:00:00Z' } });
    await relire([civil]);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('Rokhaya Gaye dirige désormais le département Génie Civil');
  });

  it('ne propose pas la désignation des chefs à un administrateur Comptes', async () => {
    const racine = await afficher(authAdmin(['CONSULTER_TABLEAU_DE_BORD', 'GERER_COMPTES']));
    expect(bouton(carte(racine, 'Génie Civil'), 'chef')).toBeUndefined();
    expect(bouton(carte(racine, 'Génie Civil'), 'Renommer')).toBeDefined();
  });

  it('renomme une filière', async () => {
    const racine = await afficher();
    const zone = carte(racine, 'Génie Civil');
    bouton(zone, 'Renommer').click();
    fixture.detectChanges();
    const champ = zone.querySelector('input') as HTMLInputElement;
    expect(champ.value).toBe('Génie Civil');
    expect(document.activeElement).toBe(champ);
    champ.value = 'Génie Civil et Environnement';
    champ.dispatchEvent(new Event('input'));
    await soumettre(zone);
    http.expectOne({ method: 'PATCH', url: '/api/admin/filieres/f-civil/nom' }).flush({ ...civil, nom: 'Génie Civil et Environnement' });
    await relire([{ ...civil, nom: 'Génie Civil et Environnement' }]);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('s’appelle désormais « Génie Civil et Environnement »');
  });
});
