import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PageVitrine } from './page-vitrine';

describe('PageVitrine', () => {
  let fixture: ComponentFixture<PageVitrine>;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageVitrine],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PageVitrine);
    await fixture.whenStable();
    page = fixture.nativeElement as HTMLElement;
  });

  it('a un seul titre de premier niveau', () => {
    const titres = page.querySelectorAll('h1');
    expect(titres.length).toBe(1);
    expect(titres[0].textContent).toContain('Le réseau des diplômés de l’EPT');
  });

  it('mène à la connexion et à l inscription', () => {
    const cibles = Array.from(page.querySelectorAll('a')).map((lien) => lien.getAttribute('href'));
    expect(cibles).toContain('/connexion');
    expect(cibles).toContain('/inscription');
  });

  it('organise l en-tete en deux barres', () => {
    const barreEcole = page.querySelector<HTMLElement>('.barre-ecole');
    expect(barreEcole?.querySelectorAll('app-liens-ecole a').length).toBe(4);
    expect(barreEcole?.querySelector('a[href="/annuaire-diplomes"]')?.textContent).toContain('Annuaire des diplômés');
    expect(barreEcole?.querySelector('form[role="search"] label')?.textContent).toContain('Rechercher sur le site');
    expect(barreEcole?.querySelector('a[href="/connexion"]')?.textContent).toContain('Se connecter');

    const barrePrincipale = page.querySelector<HTMLElement>('.barre-principale');
    const boutons = Array.from(barrePrincipale?.querySelectorAll('.declencheur') ?? []);
    expect(boutons.map((bouton) => bouton.textContent?.trim())).toEqual(['Communauté', 'Actualité', 'Carrière', 'Offres d’emploi', 'Partenariats']);
    expect(barrePrincipale?.querySelector('.bouton-rejoindre')?.textContent).toContain('Nous rejoindre');
    expect(barrePrincipale?.querySelector('.bouton-rejoindre')?.getAttribute('href')).toBe('/inscription');
  });

  it('ouvre et referme le menu des rubriques', async () => {
    const bouton = page.querySelector<HTMLButtonElement>('.bouton-menu');
    const rubriques = page.querySelector<HTMLElement>('.rubriques');
    expect(bouton?.getAttribute('aria-expanded')).toBe('false');
    expect(bouton?.getAttribute('aria-controls')).toBe(rubriques?.id);
    expect(bouton?.getAttribute('aria-label')).toBe('Menu des rubriques');

    bouton?.click();
    await fixture.whenStable();
    expect(bouton?.getAttribute('aria-expanded')).toBe('true');
    expect(rubriques?.classList.contains('ouvert')).toBe(true);

    bouton?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(bouton?.getAttribute('aria-expanded')).toBe('false');
    expect(rubriques?.classList.contains('ouvert')).toBe(false);
  });

  it('ouvre une seule liste deroulante a la fois et la referme avec Echap', async () => {
    const boutons = Array.from(page.querySelectorAll<HTMLButtonElement>('.declencheur'));
    const panneau = (bouton: HTMLButtonElement) => page.querySelector<HTMLElement>(`#${bouton.getAttribute('aria-controls')}`);
    expect(boutons.every((bouton) => bouton.getAttribute('aria-expanded') === 'false')).toBe(true);

    boutons[0].click();
    await fixture.whenStable();
    expect(boutons[0].getAttribute('aria-expanded')).toBe('true');
    expect(panneau(boutons[0])?.hidden).toBe(false);

    boutons[3].click();
    await fixture.whenStable();
    expect(panneau(boutons[0])?.hidden).toBe(true);
    expect(panneau(boutons[3])?.hidden).toBe(false);

    boutons[3].focus();
    boutons[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(panneau(boutons[3])?.hidden).toBe(true);
    expect(document.activeElement === boutons[3] || !document.contains(boutons[3])).toBe(true);
  });

  it('referme la liste au clic en dehors', async () => {
    const bouton = page.querySelector<HTMLButtonElement>('.declencheur');
    bouton?.click();
    await fixture.whenStable();
    expect(bouton?.getAttribute('aria-expanded')).toBe('true');

    document.body.click();
    await fixture.whenStable();
    expect(bouton?.getAttribute('aria-expanded')).toBe('false');
  });

  it('annonce ce qui n est pas encore disponible et ce qui demande une connexion', () => {
    const offres = page.querySelector('#menu-offres');
    expect(offres?.querySelector('a[href="/offres-emploi"]')?.textContent).toContain('À venir');
    expect(page.querySelector('#menu-actualite a[href="/evenements"]')?.textContent).toContain('Après connexion');
    expect(page.querySelector('#menu-carriere a[href="/stages"]')?.textContent).toContain('À venir');
    expect(page.querySelector('#menu-carriere a[href="/insertion"]')?.textContent).toContain('À venir');
    expect(page.querySelector('#menu-communaute a[href="/mentorat"]')?.textContent).toContain('Après connexion');
    expect(page.querySelector('#menu-communaute a[href="/annuaire-diplomes"]')).not.toBeNull();
    expect(page.querySelector('#menu-actualite a[href="/#actualites"]')?.textContent).toContain('Prochains événements');
    expect(page.querySelector('#menu-partenariats a[href="/conventions"]')?.textContent).toContain('À venir');
    expect(page.querySelector('#menu-partenariats a[href="/inscription"]')?.textContent).toContain('Créer un compte organisme');
  });

  it('suit l ordre voulu de la page', async () => {
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/public/evenements').flush([
      { titre: 'Forum', lieu: 'Campus', dateDebut: '2030-01-15T09:00:00Z', urlImage: null }
    ]);
    http.expectOne('/api/public/temoignages').flush([
      { nom: 'Awa Sow', promotion: 'D2018', fonction: 'Ingénieure', organisation: 'Kër Data', pays: 'Sénégal', texte: 'Un propos.', urlPhoto: null }
    ]);
    await fixture.whenStable();

    const titres = Array.from(page.querySelectorAll('h1, main h2')).map((titre) => titre.textContent?.trim());
    expect(titres).toEqual([
      'Le réseau des diplômés de l’EPT', 'Sur la plateforme', 'Actualités', 'L’EPT en chiffres', 'Témoignages', 'Rejoindre le réseau'
    ]);
    expect(page.querySelector('#actualites li')?.textContent).toContain('Forum');
    const temoignage = page.querySelector('#temoignages figure');
    expect(temoignage?.querySelector('blockquote')?.textContent).toContain('Un propos.');
    expect(temoignage?.querySelector('figcaption')?.textContent).toContain('Awa Sow');
    expect(temoignage?.querySelector('figcaption')?.textContent).toContain('(D2018)');
    expect(page.querySelector('.note-verification')?.textContent).toContain('@ept.edu.sn');
  });

  it('ne garde pas de section vide ni en erreur', async () => {
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/public/evenements').flush([]);
    http.expectOne('/api/public/temoignages').flush({}, { status: 500, statusText: 'Erreur' });
    await fixture.whenStable();

    expect(page.querySelector('#actualites')).toBeNull();
    expect(page.querySelector('#temoignages')).toBeNull();
  });

  it('donne une icone et un lien utile a chaque fonctionnalite', () => {
    const blocs = Array.from(page.querySelectorAll('#plateforme .fonction'));
    expect(blocs.every((bloc) => bloc.querySelector('i.pi') && bloc.querySelector('h3'))).toBe(true);
    expect(blocs.map((bloc) => bloc.querySelector('a')?.getAttribute('href'))).toEqual([
      '/annuaire-diplomes', '/mentorat', '/#actualites', '/inscription'
    ]);
    expect(blocs[1].querySelector('a')?.textContent).toContain('Se connecter');
  });

  it('garde le libelle de la banniere', () => {
    expect(page.querySelector('.banniere a[href="/inscription"]')?.textContent).toContain('Rejoindre le réseau');
  });

  it('presente les chiffres cles, les fonctionnalites et les etapes', () => {
    expect(page.querySelectorAll('.chiffres li').length).toBe(4);
    expect(page.querySelectorAll('#plateforme .fonction').length).toBe(4);
    expect(page.querySelectorAll('.etapes li').length).toBe(3);
  });

  it('signale le lien externe qui s ouvre dans un nouvel onglet', () => {
    const externe = page.querySelector<HTMLAnchorElement>('a[href="https://ept.edu.sn"]');
    expect(externe?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(externe?.textContent).toContain('(nouvel onglet)');
  });

  it('nomme chaque icone de l ecole, dans l en-tete et le pied de page', () => {
    for (const zone of ['app-entete-vitrine', 'app-pied-vitrine']) {
      const liens = Array.from(page.querySelectorAll<HTMLAnchorElement>(`${zone} app-liens-ecole a`));
      expect(liens.map((lien) => lien.getAttribute('aria-label'))).toEqual([
        'LinkedIn de l’EPT (nouvel onglet)',
        'Facebook de l’EPT (nouvel onglet)',
        'YouTube de l’EPT (nouvel onglet)',
        'Écrire à l’EPT (contact@ept.sn)'
      ]);
      expect(liens[3].getAttribute('href')).toBe('mailto:contact@ept.sn');
      expect(liens[3].hasAttribute('target')).toBe(false);
    }
  });
});
