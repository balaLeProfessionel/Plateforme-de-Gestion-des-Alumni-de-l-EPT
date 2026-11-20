import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CommentairePublication, Publication } from '../../../core/services/publications/publication';
import { CartePublication } from './carte-publication';

const base: Publication = {
  id: 'p1', type: 'PUBLICATION', titre: null, contenu: 'Bonjour', audience: 'TOUS', urlImage: null, texteAlternatif: null,
  dateLimite: null, publieLe: '2026-10-01T10:00:00Z', auteurId: 'auteur', auteurNom: 'Diop', auteurPrenom: 'Awa',
  auteurRole: 'ALUMNI', auteurPhoto: null,
  nombreJaime: 0, jaime: false, nombreCommentaires: 0, apercuCommentaire: null,
};

const commentaire: CommentairePublication = {
  id: 'c1', publicationId: 'p1', parentId: null, auteurId: 'a2', auteurNom: 'Ba', auteurPrenom: 'Moussa',
  auteurRole: 'ETUDIANT', auteurPhoto: null, contenu: 'Bravo pour cette initiative', creeLe: '2026-10-01T11:00:00Z',
};

describe('CartePublication', () => {
  const utilisateur = signal<{ id: string } | null>({ id: 'lecteur' });
  beforeEach(() => {
    utilisateur.set({ id: 'lecteur' });
    registerLocaleData(localeFr);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: { utilisateur } }, { provide: LOCALE_ID, useValue: 'fr' }],
    });
  });

  function afficher(publication: Partial<Publication>, complete = false): HTMLElement {
    const fixture = TestBed.createComponent(CartePublication);
    fixture.componentRef.setInput('publication', { ...base, ...publication });
    fixture.componentRef.setInput('complete', complete);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const texte = (element: Element | null | undefined) => element?.textContent?.replace(/\s+/g, ' ').trim();

  it('présente un article par son thème et son résumé, et mène à sa page de lecture', () => {
    const racine = afficher({ type: 'ARTICLE', titre: 'Dix ans de micro-réseaux', contenu: 'Retour d’expérience sur le terrain.',
      article: { id: 'a1', theme: 'CARRIERE', tempsLecture: 6 } });
    expect(texte(racine.querySelector('app-apercu-article .etiquette'))).toBe('Article · Carrière · 6 min de lecture');
    expect(texte(racine.querySelector('app-apercu-article h3'))).toBe('Dix ans de micro-réseaux');
    expect(racine.querySelector('.contenu')).toBeNull();
    expect(racine.querySelector('a.lire')?.getAttribute('href')).toBe('/articles/a1');
    expect(racine.querySelector('a.date')?.getAttribute('href')).toBe('/articles/a1');
  });

  it('mentionne simplement la source d’une publication LinkedIn reprise, qui s’ouvre dans un nouvel onglet', () => {
    const lien = { url: 'https://www.linkedin.com/posts/awa_stage', titre: 'Ravie de commencer mon stage…', site: 'LinkedIn',
      description: 'Ravie de commencer mon stage chez Sonatel !' };
    const racine = afficher({ contenu: 'Ravie de commencer mon stage chez Sonatel !', lien });
    expect(racine.querySelector('.lien-partage')).toBeNull();
    const source = racine.querySelector('a.source') as HTMLAnchorElement;
    expect(source.href).toBe(lien.url);
    expect(source.target).toBe('_blank');
    expect(source.rel).toContain('noopener');
    expect(texte(source)).toBe('Publié à l’origine sur LinkedIn. Voir l’original (s’ouvre dans un nouvel onglet)');
    expect(source.querySelector('.pi-linkedin')).not.toBeNull();
    expect(afficher({}).querySelector('.source, .lien-partage')).toBeNull();
    // Lien court partagé depuis l'application LinkedIn.
    const court = afficher({ contenu: 'Appel à candidatures', lien: { ...lien, url: 'https://lnkd.in/p/dwgsFCs8', site: 'LinkedIn' } });
    expect(court.querySelector('.source .pi-linkedin')).not.toBeNull();
  });

  it('présente un article partagé en carte avec son titre et sa description', () => {
    const lien = { url: 'https://blog.exemple.sn/innovation', titre: 'L’innovation à l’EPT', site: 'blog.exemple.sn',
      description: 'Retour sur dix ans de projets étudiants.' };
    const racine = afficher({ contenu: 'À lire, un bel article sur nos projets.', lien });
    const carte = racine.querySelector('a.lien-partage') as HTMLAnchorElement;
    expect(texte(carte)).toContain('blog.exemple.sn : L’innovation à l’EPT.');
    expect(carte.querySelector('.description')?.textContent).toContain('dix ans de projets');
    expect(racine.querySelector('.source')).toBeNull();
    // Un message qui reprend le texte de l'article : la carte cède la place à la mention de la source.
    expect(afficher({ contenu: 'Retour sur dix ans de projets étudiants.', lien }).querySelector('.source')).not.toBeNull();
  });

  it('distingue l’annonce officielle par son bandeau, sans badge sur une publication ordinaire', () => {
    expect(afficher({}).querySelector('.bandeau, .etiquette')).toBeNull();
    const racine = afficher({ type: 'ANNONCE_OFFICIELLE', titre: 'Rentrée 2026', auteurRole: 'ADMIN' });
    expect(racine.querySelector('.bandeau')?.textContent).toContain('Annonce officielle de l’EPT');
    expect(racine.querySelector('.role')?.textContent).toBe('Administration');
    expect(racine.querySelector('article')?.classList.contains('officielle')).toBe(true);
    expect(racine.querySelector('h3')?.textContent).toBe('Rentrée 2026');
  });

  it('affiche la date limite d’un appel à projet, puis « Clôturé » une fois passée', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 3, 12));
    try {
      const ouvert = afficher({ type: 'APPEL_PROJET', titre: 'Fonds', dateLimite: '2026-11-03' });
      expect(ouvert.querySelector('.etiquette.appel')?.textContent).toContain('Appel à projet');
      expect(ouvert.querySelector('.echeance')?.textContent).toContain('Réponses jusqu’au 3 novembre 2026 inclus');
      expect(ouvert.querySelector('.tuile .jour')?.textContent?.trim()).toBe('3');
      const clos = afficher({ type: 'APPEL_PROJET', titre: 'Fonds', dateLimite: '2026-11-02' });
      expect(clos.querySelector('.echeance.close')?.textContent).toContain('Clôturé depuis le 2 novembre 2026');
    } finally {
      vi.useRealTimers();
    }
  });

  it('ne propose pas à l’auteur de signaler sa propre publication, mais lui laisse le partage', () => {
    const lecteur = afficher({});
    (lecteur.querySelector('.declencheur') as HTMLButtonElement).click();
    TestBed.tick();
    expect(lecteur.querySelector('[role="menu"]')?.textContent).toContain('Signaler');
    utilisateur.set({ id: 'auteur' });
    const auteur = afficher({});
    (auteur.querySelector('.declencheur') as HTMLButtonElement).click();
    TestBed.tick();
    expect(auteur.querySelector('[role="menu"]')?.textContent).toContain('Partager');
    expect(auteur.querySelector('[role="menu"]')?.textContent).not.toContain('Signaler');
  });

  it('affiche les compteurs dans les boutons, et rien quand ils sont à zéro', () => {
    const racine = afficher({ nombreJaime: 3, jaime: true, nombreCommentaires: 2 });
    expect(texte(racine.querySelector('.jaime'))).toBe('J’aime 3');
    expect(racine.querySelector('.jaime')?.getAttribute('aria-pressed')).toBe('true');
    expect(texte(racine.querySelector('.action'))).toBe('Commenter 2 commentaires');
    const vide = afficher({});
    expect(texte(vide.querySelector('.jaime'))).toBe('J’aime');
    expect(texte(vide.querySelector('.action'))).toBe('Commenter');
  });

  it('coupe un texte long dans le fil avec « Voir plus », mais l’affiche en entier sur la page complète', () => {
    const long = 'Une phrase assez longue pour le fil. '.repeat(12);
    const fil = afficher({ contenu: long });
    expect(fil.querySelector('.contenu.tronque')).not.toBeNull();
    expect(fil.querySelector('a.voir-plus')?.getAttribute('href')).toBe('/publications/p1');
    expect(afficher({ contenu: 'Court' }).querySelector('.voir-plus')).toBeNull();
    const complete = afficher({ contenu: long }, true);
    expect(complete.querySelector('.contenu.tronque, .voir-plus')).toBeNull();
  });

  it('montre au plus un commentaire dans le fil, et toute la discussion sur la page complète', () => {
    const fil = afficher({ nombreCommentaires: 4, apercuCommentaire: commentaire });
    expect(fil.querySelectorAll('.apercu app-message-commentaire').length).toBe(1);
    expect(fil.querySelector('.apercu')?.textContent).toContain('Bravo pour cette initiative');
    expect(fil.querySelector('.apercu .repondre')).toBeNull();
    expect(texte(fil.querySelector('a.tous'))).toBe('Voir les 4 commentaires');
    expect(fil.querySelector('app-commentaires-publication')).toBeNull();

    const complete = afficher({ nombreCommentaires: 4, apercuCommentaire: commentaire }, true);
    expect(complete.querySelector('.apercu')).toBeNull();
    expect(complete.querySelector('app-commentaires-publication')).not.toBeNull();
  });

  it('ouvre la publication au clic sur la carte, sauf sur un bouton ou un lien', () => {
    const router = TestBed.inject(Router);
    const naviguer = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const racine = afficher({ nombreCommentaires: 1 });
    (racine.querySelector('.contenu') as HTMLElement).click();
    expect(naviguer).toHaveBeenCalledWith(['/publications', 'p1']);
    naviguer.mockClear();
    (racine.querySelector('.jaime') as HTMLButtonElement).click();
    expect(naviguer).not.toHaveBeenCalled();
    (racine.querySelector('.action') as HTMLButtonElement).click();
    expect(naviguer).toHaveBeenCalledWith(['/publications', 'p1'], { queryParams: { commenter: 1 } });
  });
});
