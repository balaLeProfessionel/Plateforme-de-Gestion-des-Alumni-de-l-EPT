import { Location, registerLocaleData } from '@angular/common';
import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Article } from '../../../core/services/articles/article';
import { EditionArticle } from './edition-article';
import { appliquerMiseEnForme } from './mise-en-forme';

const brouillon: Article = {
  id: 'a1', publicationId: null, titre: 'Micro-réseaux', resume: null, contenu: '', theme: 'PARCOURS', urlCouverture: null,
  tempsLecture: 1, audience: 'TOUS', statut: 'BROUILLON', creeLe: '2026-11-07T10:00:00Z', modifieLe: '2026-11-07T10:00:00Z',
  publieLe: null, auteurId: 'u1', auteurNom: 'Diop', auteurPrenom: 'Awa', auteurRole: 'ALUMNI', auteurPhoto: null,
  estAuteur: true, nombreJaime: 0, jaime: false, nombreCommentaires: 0,
};

describe('Mise en forme des articles', () => {
  it('entoure la sélection de gras ou d’italique et garde le mot sélectionné', () => {
    expect(appliquerMiseEnForme({ texte: 'Un mot fort', debut: 3, fin: 6 }, 'gras'))
      .toEqual({ texte: 'Un **mot** fort', debut: 5, fin: 8 });
    expect(appliquerMiseEnForme({ texte: '', debut: 0, fin: 0 }, 'italique').texte).toBe('*texte en italique*');
  });

  it('transforme les lignes en intertitre ou en liste, et un second clic retire la marque', () => {
    const liste = appliquerMiseEnForme({ texte: 'un\ndeux', debut: 0, fin: 7 }, 'liste');
    expect(liste.texte).toBe('- un\n- deux');
    expect(appliquerMiseEnForme({ ...liste }, 'liste').texte).toBe('un\ndeux');
    expect(appliquerMiseEnForme({ texte: 'Intro\n- Cadrage', debut: 8, fin: 8 }, 'intertitre').texte).toBe('Intro\n## Cadrage');
  });

  it('prépare un lien et sélectionne l’adresse à coller', () => {
    const lien = appliquerMiseEnForme({ texte: 'Voir le site', debut: 5, fin: 12 }, 'lien');
    expect(lien.texte).toBe('Voir [le site](https://)');
    expect(lien.texte.slice(lien.debut, lien.fin)).toBe('https://');
  });
});

describe('EditionArticle', () => {
  let fixture: ComponentFixture<EditionArticle>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;
  let replaceState: ReturnType<typeof vi.fn>;

  async function afficher(id: string | null = null) {
    registerLocaleData(localeFr);
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
    await TestBed.configureTestingModule({
      imports: [EditionArticle],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } }],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    replaceState = vi.spyOn(TestBed.inject(Location), 'replaceState').mockImplementation(() => {});
    fixture = TestBed.createComponent(EditionArticle);
    fixture.detectChanges();
    if (id) {
      http.expectOne(`/api/articles/${id}`).flush(brouillon);
      await fixture.whenStable();
      fixture.detectChanges();
    }
  }

  afterEach(() => http.verify());

  const racine = () => fixture.nativeElement as HTMLElement;
  function saisir(selecteur: string, valeur: string) {
    const champ = racine().querySelector(selecteur) as HTMLTextAreaElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
  /** Les enregistrements s’enchaînent par promesses et minuteries : attendre que la requête parte. */
  async function requete(critere: (req: HttpRequest<unknown>) => boolean): Promise<TestRequest> {
    let trouvee: TestRequest | undefined;
    await vi.waitFor(() => {
      trouvee = http.match(critere)[0];
      expect(trouvee).toBeDefined();
    }, { timeout: 3000 });
    return trouvee!;
  }

  it('enregistre tout seul le brouillon après une pause de frappe, sans quitter l’éditeur', async () => {
    await afficher();
    saisir('#article-titre', '  Micro-réseaux  ');
    const creation = await requete((req) => req.method === 'POST' && req.url === '/api/articles');
    expect(creation.request.body).toEqual({ titre: 'Micro-réseaux', resume: null, contenu: '', theme: 'PARCOURS', audience: 'TOUS' });
    creation.flush(brouillon);
    await vi.waitFor(() => expect(replaceState).toHaveBeenCalledWith('/articles/a1/modifier'));
    fixture.detectChanges();
    expect(racine().querySelector('app-barre-creation .etat')?.textContent).toBe('Brouillon enregistré');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('refuse de publier un article incomplet et n’ouvre pas la fenêtre de publication', async () => {
    await afficher('a1');
    (racine().querySelector('app-barre-creation .action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine().querySelector('#erreur-resume')?.textContent).toContain('Ajoutez un résumé');
    expect(racine().querySelector('#erreur-contenu')?.textContent).toContain('Écrivez le texte');
    expect(racine().querySelector('dialog')?.open).toBe(false);
  });

  it('demande le thème et le public au moment de publier, puis ouvre la page de lecture', async () => {
    await afficher('a1');
    saisir('#article-resume', 'Dix ans de terrain.');
    saisir('#article-contenu', '## Cadrage\n\nLe premier chantier.');
    (racine().querySelector('app-barre-creation .action') as HTMLButtonElement).click();
    fixture.detectChanges();
    const dialogue = racine().querySelector('dialog')!;
    expect(dialogue.open).toBe(true);
    const carriere = [...dialogue.querySelectorAll<HTMLInputElement>('input[name="theme-article"]')].find((i) => i.value === 'CARRIERE')!;
    carriere.click();
    (dialogue.querySelector('input[value="ALUMNI"]') as HTMLInputElement).click();
    (dialogue.querySelector('.confirmer') as HTMLButtonElement).click();
    const modification = await requete((req) => req.method === 'PUT' && req.url === '/api/articles/a1');
    expect(modification.request.body).toEqual({ titre: 'Micro-réseaux', resume: 'Dix ans de terrain.',
      contenu: '## Cadrage\n\nLe premier chantier.', theme: 'CARRIERE', audience: 'ALUMNI' });
    modification.flush({ ...brouillon, theme: 'CARRIERE' });
    (await requete((req) => req.method === 'PATCH' && req.url === '/api/articles/a1/publier'))
      .flush({ ...brouillon, statut: 'PUBLIE', publicationId: 'p1' });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/articles', 'a1'], { replaceUrl: true }));
  });

  it('met la sélection en gras depuis la barre d’outils', async () => {
    await afficher('a1');
    saisir('#article-contenu', 'Un mot fort');
    const champ = racine().querySelector('#article-contenu') as HTMLTextAreaElement;
    champ.setSelectionRange(3, 6);
    (racine().querySelector('.outil.gras') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(champ.value).toBe('Un **mot** fort');
    // L’enregistrement automatique part ensuite avec le texte mis en forme.
    const modification = await requete((req) => req.method === 'PUT' && req.url === '/api/articles/a1');
    expect(modification.request.body).toMatchObject({ contenu: 'Un **mot** fort' });
    modification.flush({ ...brouillon, contenu: 'Un **mot** fort' });
  });

  it('signale un enregistrement refusé, par exemple la limite de brouillons', async () => {
    await afficher();
    saisir('#article-titre', 'Un de trop');
    (await requete((req) => req.url === '/api/articles'))
      .flush({ message: 'Vous avez déjà 20 brouillons.' }, { status: 409, statusText: 'Conflict' });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(racine().querySelector('.message-erreur')?.textContent).toContain('Vous avez déjà 20 brouillons.');
      expect(racine().querySelector('app-barre-creation .etat')?.textContent).toBe('Enregistrement impossible');
    });
  });
});
