import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RedactionPublication } from './redaction-publication';

describe('RedactionPublication (administration)', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 3, 12));
  });
  afterEach(() => { http.verify(); vi.useRealTimers(); });

  function ouvrir() {
    const fixture = TestBed.createComponent(RedactionPublication);
    fixture.componentRef.setInput('types', ['ANNONCE_OFFICIELLE', 'APPEL_PROJET']);
    fixture.detectChanges();
    const racine: HTMLElement = fixture.nativeElement;
    (racine.querySelector('.ouvrir-redaction') as HTMLButtonElement).click();
    fixture.detectChanges();
    const saisir = (selecteur: string, valeur: string) => {
      const champ = racine.querySelector(selecteur) as HTMLInputElement;
      champ.value = valeur;
      champ.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const soumettre = () => {
      racine.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      fixture.detectChanges();
    };
    const choisirType = (libelle: string) => {
      ([...racine.querySelectorAll('.choix-type button')].find((b) => b.textContent?.includes(libelle)) as HTMLButtonElement).click();
      fixture.detectChanges();
    };
    return { fixture, racine, saisir, soumettre, choisirType };
  }

  it('propose les deux types officiels, l’annonce d’abord, avec un titre obligatoire', () => {
    const { racine, saisir, soumettre } = ouvrir();
    expect(racine.querySelector('h2')?.textContent).toBe('Nouvelle annonce officielle');
    expect([...racine.querySelectorAll('.choix-type button')].map((b) => [b.textContent?.trim(), b.getAttribute('aria-pressed')]))
      .toEqual([['Annonce officielle', 'true'], ['Appel à projet', 'false']]);
    expect(racine.querySelector('#publication-date-limite')).toBeNull();
    saisir('textarea', 'Les inscriptions ouvrent lundi.');
    soumettre();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Donnez un titre');
  });

  it('demande une date limite à venir pour un appel à projet et l’envoie', async () => {
    const { fixture, racine, saisir, soumettre, choisirType } = ouvrir();
    let publiee: unknown;
    fixture.componentInstance.publiee.subscribe((p) => (publiee = p));
    choisirType('Appel à projet');
    expect(racine.querySelector('h2')?.textContent).toBe('Nouvel appel à projet');
    saisir('#publication-titre', 'Fonds d’innovation');
    saisir('textarea', 'Proposez vos projets.');
    soumettre();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Indiquez la date limite');
    saisir('#publication-date-limite', '2026-11-02');
    soumettre();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('déjà passée');

    saisir('#publication-date-limite', '2026-11-03');
    soumettre();
    const requete = http.expectOne('/api/publications');
    expect(requete.request.body).toEqual({ type: 'APPEL_PROJET', titre: 'Fonds d’innovation', contenu: 'Proposez vos projets.',
      audience: 'TOUS', dateLimite: '2026-11-03' });
    requete.flush({ id: 'n', type: 'APPEL_PROJET' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(publiee).toEqual({ id: 'n', type: 'APPEL_PROJET' });
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('L’appel à projet est diffusé');
  });

  it('affiche le message du serveur quand il refuse la publication', async () => {
    const { fixture, racine, saisir, soumettre } = ouvrir();
    saisir('#publication-titre', 'Rentrée');
    saisir('textarea', 'Texte');
    soumettre();
    http.expectOne('/api/publications').flush({ message: 'Seule l\'administration peut publier une annonce officielle.' },
      { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Seule l\'administration');
  });
});

describe('RedactionPublication (import depuis un lien)', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function ouvrir() {
    const fixture = TestBed.createComponent(RedactionPublication);
    fixture.componentRef.setInput('integree', true);
    fixture.detectChanges();
    const racine: HTMLElement = fixture.nativeElement;
    const saisir = (selecteur: string, valeur: string) => {
      const champ = racine.querySelector(selecteur) as HTMLInputElement;
      champ.value = valeur;
      champ.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const cliquer = (libelle: string) => {
      ([...racine.querySelectorAll('button')].find((b) => b.textContent?.includes(libelle)) as HTMLButtonElement).click();
      fixture.detectChanges();
    };
    const soumettre = () => {
      racine.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      fixture.detectChanges();
    };
    // Le champ du lien s'ouvre depuis la barre d'outils du composeur.
    expect(racine.querySelector('#publication-lien')).toBeNull();
    cliquer('LinkedIn');
    return { fixture, racine, saisir, cliquer, soumettre };
  }

  it('reprend le texte de la page, rappelle l’accord de l’auteur et envoie le lien', async () => {
    const { fixture, racine, saisir, cliquer, soumettre } = ouvrir();
    saisir('#publication-lien', 'linkedin.com/posts/awa_stage');
    cliquer('Importer');
    const lecture = http.expectOne('/api/apercus-lien');
    expect(lecture.request.body).toEqual({ url: 'linkedin.com/posts/awa_stage' });
    lecture.flush({ url: 'https://linkedin.com/posts/awa_stage', titre: 'Awa Diop sur LinkedIn', site: 'LinkedIn',
      description: 'Ravie de commencer mon stage !', image: null });
    await fixture.whenStable();
    fixture.detectChanges();

    expect((racine.querySelector('textarea') as HTMLTextAreaElement).value).toBe('Ravie de commencer mon stage !');
    expect(racine.querySelector('app-apercu-lien-importe')?.textContent).toContain('Awa Diop sur LinkedIn');
    expect(racine.querySelector('.mention-lien')?.textContent).toContain('ce contenu est le vôtre');
    soumettre();
    const creation = http.expectOne('/api/publications');
    expect(creation.request.body).toEqual({ type: 'PUBLICATION', titre: '', contenu: 'Ravie de commencer mon stage !',
      audience: 'TOUS', lien: 'https://linkedin.com/posts/awa_stage' });
    creation.flush({ id: 'n', type: 'PUBLICATION' });
  });

  it('guide le membre quand le site refuse la lecture, sans toucher à son texte', async () => {
    const { fixture, racine, saisir, cliquer } = ouvrir();
    saisir('textarea', 'Mon texte à moi');
    saisir('#publication-lien', 'https://www.linkedin.com/posts/x');
    cliquer('Importer');
    http.expectOne('/api/apercus-lien').flush({ url: 'https://www.linkedin.com/posts/x', titre: null, description: null,
      image: null, site: 'linkedin.com' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('app-apercu-lien-importe')?.textContent).toContain('LinkedIn n’a pas partagé son texte');
    expect((racine.querySelector('textarea') as HTMLTextAreaElement).value).toBe('Mon texte à moi');

    (racine.querySelector('[aria-label="Retirer le lien"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine.querySelector('app-apercu-lien-importe')).toBeNull();
    expect((racine.querySelector('#publication-lien') as HTMLInputElement).value).toBe('');
    expect(racine.querySelector('.mention-lien')).toBeNull();
  });

  it('importe directement un lien collé seul dans un message vide, comme une messagerie', () => {
    const { fixture, racine } = ouvrir();
    const message = racine.querySelector('textarea') as HTMLTextAreaElement;
    const collage = new Event('paste', { cancelable: true }) as ClipboardEvent;
    Object.defineProperty(collage, 'clipboardData', { value: { getData: () => ' https://www.linkedin.com/posts/awa ' } });
    message.dispatchEvent(collage);
    fixture.detectChanges();
    expect(collage.defaultPrevented).toBe(true);
    expect(http.expectOne('/api/apercus-lien').request.body).toEqual({ url: 'https://www.linkedin.com/posts/awa' });
    expect((racine.querySelector('#publication-lien') as HTMLInputElement).value).toBe('https://www.linkedin.com/posts/awa');
  });

  it('affiche le refus du serveur pour une adresse interne', async () => {
    const { fixture, racine, saisir, cliquer } = ouvrir();
    saisir('#publication-lien', 'http://127.0.0.1/admin');
    cliquer('Importer');
    http.expectOne('/api/apercus-lien').flush({ message: 'Seuls les liens web publics peuvent être importés.' },
      { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('.erreur-lien')?.textContent).toContain('Seuls les liens web publics');
  });
});
