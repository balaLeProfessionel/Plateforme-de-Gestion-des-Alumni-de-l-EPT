import { registerLocaleData } from '@angular/common';
import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CommunauteAdmin } from '../../../core/services/models/messagerie.model';
import { CommunautesAdmin } from './communautes';

registerLocaleData(localeFr);

const API = '/api/admin/communautes';
const communaute = (id: string, nom: string, valeurs: Partial<CommunauteAdmin> = {}): CommunauteAdmin => ({
  id, nom, description: null, urlPhoto: null, categorie: 'VILLE', acces: 'OUVERTE', automatique: false,
  nombreMembres: 12, creeLe: '2026-10-01T10:00:00Z', derniereActivite: '2026-11-20T10:00:00Z', ...valeurs,
});
const page = (contenu: CommunauteAdmin[], numero = 0, totalPages = 1) =>
  ({ contenu, page: numero, taille: 20, totalElements: totalPages > 1 ? 20 * totalPages : contenu.length, totalPages });
const RESUME = { total: 5, parCategorie: { VILLE: 2, SECTEUR: 1, INTERET: 0, PROMO: 2, FILIERE: 0, PROMO_FILIERE: 0 } };

describe('CommunautesAdmin', () => {
  let http: HttpTestingController;
  /** La recherche part après le délai de saisie : on l'attend au lieu de parier sur une durée fixe. */
  const requeteAttendue = (critere: (requete: HttpRequest<unknown>) => boolean) => vi.waitFor(() => {
    const [requete] = http.match(critere);
    if (!requete) throw new Error('Requête pas encore envoyée');
    return requete;
  }, { timeout: 3000 });
  let fixture: ComponentFixture<CommunautesAdmin>;
  let racine: HTMLElement;

  beforeEach(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
    Element.prototype.scrollIntoView ??= function () { /* absent de jsdom */ };
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  async function rendre(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function afficher(liste: CommunauteAdmin[], totalPages = 1): Promise<void> {
    fixture = TestBed.createComponent(CommunautesAdmin);
    racine = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    http.expectOne(`${API}/resume`).flush(RESUME);
    http.expectOne((r) => r.url === API && r.params.get('page') === '0').flush(page(liste, 0, totalPages));
    await rendre();
  }
  const statuts = () => [...racine.querySelectorAll('[role="status"]')].map((statut) => statut.textContent?.trim());

  const bouton = (libelle: string, dans: ParentNode = racine) =>
    [...dans.querySelectorAll('button')].find((b) => b.textContent?.includes(libelle)) as HTMLButtonElement;
  async function saisir(selecteur: string, valeur: string): Promise<void> {
    const champ = racine.querySelector(selecteur) as HTMLInputElement | HTMLTextAreaElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    await rendre();
  }

  it('liste les communautés avec leur catégorie, leurs membres et leur accès', async () => {
    await afficher([
      communaute('v', 'EPT à Dakar', { description: 'Afterworks' }),
      communaute('i', 'Mentors', { categorie: 'INTERET', acces: 'SUR_DEMANDE', nombreMembres: 1 }),
      communaute('p', 'Promo 2015', { categorie: 'PROMO', automatique: true }),
    ]);
    const lignes = [...racine.querySelectorAll('.ligne')];
    expect(racine.querySelector('.resume')?.textContent).toBe('3 communautés');
    expect(lignes[0].querySelector('.details')?.textContent).toContain('Ville');
    expect(lignes[0].querySelector('.details')?.textContent).toContain('12 membres');
    expect(lignes[0].querySelector('.description')?.textContent).toBe('Afterworks');
    expect(lignes[1].querySelector('.details')?.textContent).toContain('1 membre');
    expect(lignes[1].querySelector('.acces')?.textContent?.trim()).toBe('Sur demande');
    expect(lignes[2].querySelector('.acces')?.textContent?.trim()).toBe('Automatique');
    expect(lignes[2].querySelector('button')?.getAttribute('aria-label')).toBe('Modifier Promo 2015');
  });

  it('montre chaque catégorie avec son nombre, « Toutes » choisie d’abord', async () => {
    await afficher([communaute('v', 'EPT à Dakar')]);
    const pastilles = [...racine.querySelectorAll<HTMLButtonElement>('.categorie')];
    expect(pastilles.map((p) => p.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Toutes 5', 'Ville 2', 'Secteur 1', 'Centre d’intérêt 0', 'Promo 2', 'Filière 0', 'Promo · filière 0',
    ]);
    expect(pastilles[0].getAttribute('aria-pressed')).toBe('true');
    expect(pastilles[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('filtre par nom et par catégorie, annonce le résultat et dit ce qui n’a rien donné', async () => {
    await afficher([communaute('v', 'EPT à Dakar')]);
    await saisir('#recherche-communautes-admin', ' dakar ');
    (await requeteAttendue((r) => r.url === API && r.params.get('recherche') === 'dakar' && !r.params.has('categorie')))
      .flush(page([communaute('v', 'EPT à Dakar')]));
    await rendre();
    expect(statuts()).toContain('1 communauté trouvée.');

    (racine.querySelector('[data-categorie="PROMO"]') as HTMLButtonElement).click();
    await rendre();
    http.expectOne((r) => r.url === API && r.params.get('recherche') === 'dakar' && r.params.get('categorie') === 'PROMO'
      && r.params.get('page') === '0').flush(page([]));
    await rendre();
    expect(racine.querySelector('[data-categorie="PROMO"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(racine.querySelector('.etat h2')?.textContent).toBe('Aucune communauté ne correspond');
    expect(racine.querySelector('.etat p')?.textContent).toBe('Aucune communauté ne correspond à « dakar » parmi « Promo ».');
    expect(statuts()).toContain('Aucune communauté trouvée.');

    bouton('Effacer les filtres').click();
    await rendre();
    http.expectOne((r) => r.url === API && !r.params.has('recherche') && !r.params.has('categorie')).flush(page([]));
    await rendre();
    expect(document.activeElement?.id).toBe('recherche-communautes-admin');
    expect(racine.querySelector('[data-categorie="TOUTES"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('après un changement de page, met le focus au début de la nouvelle page une fois chargée', async () => {
    await afficher([communaute('a', 'Alpha')], 2);
    bouton('Suivant').click();
    await rendre();
    expect(document.activeElement?.id).not.toBe('resume-communautes');
    http.expectOne((r) => r.url === API && r.params.get('page') === '1').flush(page([communaute('b', 'Bêta')], 1, 2));
    await rendre();
    expect(document.activeElement?.id).toBe('resume-communautes');
    expect(racine.querySelector('.nom')?.textContent).toBe('Bêta');
  });

  it('crée une communauté après avoir vérifié son nom, puis la montre et l’annonce', async () => {
    await afficher([]);
    bouton('Nouvelle communauté').click();
    await rendre();
    const dialogue = racine.querySelector('dialog') as HTMLDialogElement;
    expect(dialogue.open).toBe(true);
    expect(document.activeElement?.id).toBe('nom-communaute');

    bouton('Créer la communauté', dialogue).click();
    await rendre();
    expect(dialogue.querySelector('#erreur-nom-communaute')?.textContent).toContain('Donnez un nom');

    await saisir('#nom-communaute', ' EPT à Saint-Louis ');
    expect(dialogue.querySelector('#compteur-nom-communaute')?.textContent?.trim()).toBe('19 / 80 caractères');
    const categorie = racine.querySelector('#categorie-communaute') as HTMLSelectElement;
    categorie.value = 'SECTEUR';
    categorie.dispatchEvent(new Event('input'));
    (racine.querySelector('input[value="SUR_DEMANDE"]') as HTMLInputElement).click();
    await saisir('#description-communaute', 'Les alumni du Nord');
    bouton('Créer la communauté', dialogue).click();
    const creation = http.expectOne(API);
    expect(creation.request.method).toBe('POST');
    expect(creation.request.body).toEqual({
      nom: 'EPT à Saint-Louis', description: 'Les alumni du Nord', categorie: 'SECTEUR', acces: 'SUR_DEMANDE',
    });
    creation.flush(communaute('n', 'EPT à Saint-Louis', { categorie: 'SECTEUR', acces: 'SUR_DEMANDE', nombreMembres: 0 }));
    await rendre();
    expect(racine.querySelector('dialog')).toBeNull();
    expect(statuts()).toContain('La communauté « EPT à Saint-Louis » est créée.');
    http.expectOne(`${API}/resume`).flush({ ...RESUME, total: 6 });

    (await requeteAttendue((r) => r.url === API && r.params.get('recherche') === 'EPT à Saint-Louis'))
      .flush(page([communaute('n', 'EPT à Saint-Louis', { nombreMembres: 0 })]));
    await rendre();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Modifier EPT à Saint-Louis');
  });

  it('ne modifie que la description d’une promo, et rend le focus au bouton', async () => {
    await afficher([communaute('p', 'Promo 2015', { categorie: 'PROMO', automatique: true })]);
    const modifier = bouton('Modifier');
    modifier.click();
    await rendre();
    const dialogue = racine.querySelector('dialog') as HTMLDialogElement;
    expect(dialogue.querySelector('#nom-communaute')).toBeNull();
    expect(dialogue.querySelector('.fixe')?.textContent).toContain('Communauté de promo');
    expect(document.activeElement?.id).toBe('description-communaute');
    expect(bouton('Enregistrer', dialogue).disabled).toBe(true);

    await saisir('#description-communaute', 'Les ingénieurs de 2015');
    bouton('Enregistrer', dialogue).click();
    const modification = http.expectOne(`${API}/p`);
    expect(modification.request.method).toBe('PATCH');
    expect(modification.request.body).toEqual({ description: 'Les ingénieurs de 2015' });
    modification.flush(communaute('p', 'Promo 2015', { categorie: 'PROMO', automatique: true, description: 'Les ingénieurs de 2015' }));
    await rendre();
    http.expectOne((r) => r.url === API).flush(page([
      communaute('p', 'Promo 2015', { categorie: 'PROMO', automatique: true, description: 'Les ingénieurs de 2015' }),
    ]));
    await rendre();
    expect(racine.querySelector('.description')?.textContent).toBe('Les ingénieurs de 2015');
    expect(document.activeElement).toBe(modifier);
  });

  it('affiche le refus du serveur dans la fenêtre', async () => {
    await afficher([communaute('v', 'EPT à Dakar')]);
    bouton('Modifier').click();
    await rendre();
    await saisir('#nom-communaute', 'Dakar');
    bouton('Enregistrer', racine.querySelector('dialog')!).click();
    http.expectOne(`${API}/v`).flush({ message: 'Cette communauté est introuvable.' }, { status: 404, statusText: 'Not Found' });
    await rendre();
    expect(racine.querySelector('dialog [role="alert"]')?.textContent).toContain('Cette communauté est introuvable.');
  });
});
