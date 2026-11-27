import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../core/services/auth/auth-service';
import { CompteurInscriptions } from '../../core/services/admin/compteur-inscriptions';
import { CompteurOffresAVerifier } from '../../core/services/stages/compteur-offres';
import { CompteurSignalements } from '../../core/services/publications/moderation';
import { CompteurDemandesMentorat } from '../../core/services/mentorat/compteur-demandes';
import { NotificationService } from '../../core/services/notifications/notifications';
import { CompteurMessages } from '../../core/services/messagerie/compteur-messages';
import { EspaceMembre } from './espace-membre';

// Le premier rendu de la barre latérale PrimeNG charge tout le module : seul, il prend
// moins d’une seconde, mais sous la suite complète en parallèle il dépasse les 5 s par défaut.
vi.setConfig({ testTimeout: 20_000 });

describe('Navigation de l’espace membre', () => {
  const utilisateur = signal<Record<string, string> | null>(null);
  const logout = vi.fn();
  const demandesEnAttente = signal(0);
  const actualiserCompteur = vi.fn();
  const resynchroniser = vi.fn();
  const inscriptionsEnAttente = signal(0);
  const actualiserInscriptions = vi.fn();
  const signalementsEnAttente = signal(0);
  const actualiserSignalements = vi.fn();
  const notifications = { nonLues: signal(0), demarrer: vi.fn(), arreter: vi.fn() };
  const messagesNonLus = signal(0);
  const compteurMessages = { nombre: messagesNonLus, demarrer: vi.fn(), arreter: vi.fn(), actualiser: vi.fn() };
  const offresAVerifier = signal(0);
  const actualiserOffres = vi.fn();

  beforeEach(() => {
    utilisateur.set({ role: 'ALUMNI', nom: 'Diop', prenom: 'Awa' });
    logout.mockClear();
    demandesEnAttente.set(0);
    actualiserCompteur.mockClear();
    resynchroniser.mockClear();
    inscriptionsEnAttente.set(0);
    actualiserInscriptions.mockClear();
    signalementsEnAttente.set(0);
    actualiserSignalements.mockClear();
    notifications.nonLues.set(0);
    messagesNonLus.set(0);
    compteurMessages.demarrer.mockClear();
    notifications.demarrer.mockClear();
    notifications.arreter.mockClear();
    offresAVerifier.set(0);
    actualiserOffres.mockClear();
    TestBed.configureTestingModule({
      imports: [EspaceMembre],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: AuthService,
          useValue: {
            utilisateur, logout, resynchroniser,
            aPermission: (permission: string) => utilisateur()?.['role'] === 'ADMIN' && permission !== '',
          },
        },
        { provide: CompteurDemandesMentorat, useValue: { nombre: demandesEnAttente, actualiser: actualiserCompteur } },
        { provide: CompteurInscriptions, useValue: { nombre: inscriptionsEnAttente, actualiser: actualiserInscriptions } },
        { provide: CompteurOffresAVerifier, useValue: { nombre: offresAVerifier, actualiser: actualiserOffres } },
        { provide: CompteurSignalements, useValue: { nombre: signalementsEnAttente, actualiser: actualiserSignalements } },
        { provide: NotificationService, useValue: notifications },
        { provide: CompteurMessages, useValue: compteurMessages }
      ]
    });
  });

  it('relie les écrans existants, dont les offres d’emploi', () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const liens = [...racine.querySelectorAll('.barre-laterale nav a')]
      .map((lien) => lien.getAttribute('href'));

    expect(liens).toEqual(['/accueil', '/annuaire', '/messagerie', '/evenements', '/articles', '/mentorat', '/stages', '/offres-emploi', '/partenaires']);
    expect(racine.querySelector('.barre-laterale .marque')?.getAttribute('href')).toBe('/accueil');
    expect([...racine.querySelectorAll('.barre-laterale nav button[aria-disabled="true"]')]
      .map((lien) => lien.getAttribute('aria-label')))
      .toEqual([]);
    // En-tête mobile : la marque et la cloche seulement, le compte passe par « Menu » en bas.
    expect(racine.querySelector('.entete-mobile button:not(.bouton-cloche)')).toBeNull();
  });

  it('synchronise la fermeture native du menu avec les boutons d’ouverture', () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const compte = racine.querySelector('.navigation-mobile button') as HTMLButtonElement;
    const dialogue = racine.querySelector('#menu-mobile') as HTMLDialogElement;
    simulerDialogueNatif(dialogue);
    const defilementInitial = document.documentElement.style.overflow;

    compte.click();
    fixture.detectChanges();
    expect(document.documentElement.style.overflow).toBe('hidden');
    dialogue.dispatchEvent(new Event('cancel'));
    fixture.detectChanges();

    expect(dialogue.open).toBe(false);
    expect(compte.getAttribute('aria-expanded')).toBe('false');
    expect(document.documentElement.style.overflow).toBe(defilementInitial);
  });

  it('permet de replier et déplier la barre latérale avec un contrôle accessible', () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const bascule = racine.querySelector('.barre-outils button') as HTMLButtonElement;
    const sidebar = racine.querySelector('.barre-laterale') as HTMLElement;
    const etatInitial = sidebar.getAttribute('data-state');

    bascule.click();
    fixture.detectChanges();

    expect(sidebar.getAttribute('data-state')).not.toBe(etatInitial);
    expect(bascule.getAttribute('aria-label')).toMatch(/navigation/);
    expect(sidebar.hasAttribute('data-overlay')).toBe(false);
    expect(racine.querySelector('p-sidebar-backdrop')).toBeNull();
  });

  it('affiche la photo de profil dans les avatars et revient aux initiales si elle échoue', () => {
    utilisateur.set({ role: 'ALUMNI', nom: 'Diop', prenom: 'Awa', urlPhoto: '/api/photos/awa.png' });
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const photos = [...racine.querySelectorAll<HTMLImageElement>('app-avatar-membre img')];

    expect(photos.map((photo) => photo.getAttribute('src'))).toEqual(['/api/photos/awa.png']);

    photos[0].dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(racine.querySelector('.barre-laterale app-avatar-membre img')).toBeNull();
    expect(racine.querySelector('.barre-laterale app-avatar-membre')?.textContent?.trim()).toBe('AD');
    expect(racine.querySelector('.barre-laterale app-avatar-membre')?.getAttribute('data-role')).toBe('ALUMNI');
  });

  it('regroupe profil, paramètres et déconnexion dans le menu du compte', () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const compte = racine.querySelector('.bouton-compte-lateral') as HTMLButtonElement;

    expect(compte.getAttribute('aria-label')).toBe('Menu du compte de Awa Diop, Alumni');
    compte.click();
    fixture.detectChanges();

    const entrees = [...document.querySelectorAll('#menu-compte [role="menuitem"]')];
    expect(entrees.map((entree) => entree.textContent?.trim())).toEqual(['Mon profil', 'Déconnexion']);
    expect(document.querySelector('#menu-compte a[href="/profil"]')).not.toBeNull();
    expect(document.querySelector('#menu-compte a[href="/profil/parametres"]')).toBeNull();

    (document.querySelector('#menu-compte [role="menuitem"]:last-child a') as HTMLElement | null)?.click();
    fixture.detectChanges();
    expect(logout).toHaveBeenCalled();
    fixture.destroy();
  });

  it('adapte les liens au type de compte', () => {
    utilisateur.set({ role: 'ORGANISME', nom: 'EPT', prenom: '' });
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('.menu-mobile a')?.getAttribute('href'))
      .toBe('/organisme/parametres');
    expect(racine.querySelector('a[href="/mentorat"]')).toBeNull();
    expect(racine.querySelector('a[href="/stages"]')).not.toBeNull();
    // Un institut partenaire gère ses offres de mobilité ; il ne voit pas la liste des candidats.
    expect(racine.querySelector('a[href="/mobilites/mes-offres"]')).not.toBeNull();
    // Il suit ses conventions de partenariat avec l’EPT.
    expect(racine.querySelector('a[href="/partenariats"]')).not.toBeNull();
    expect(racine.querySelector('a[href="/partenaires"]')).toBeNull();
    expect(racine.querySelector('.menu-mobile a[aria-label="Paramètres du profil"]')).toBeNull();
    // Un organisme publie, écrit et organise ; le mentorat ne le concerne pas.
    expect(racine.querySelector('a[href="/mentorat"]')).toBeNull();
    expect(racine.querySelector('a[href="/evenements"]')).not.toBeNull();
    expect(racine.querySelector('a[href="/articles"]')).not.toBeNull();
    (racine.querySelector('.bouton-compte-lateral') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect([...document.querySelectorAll('#menu-compte [role="menuitem"]')].map((entree) => entree.textContent?.trim()))
      .toEqual(['Mon organisme', 'Déconnexion']);
    expect(document.querySelector('#menu-compte a[href="/organisme/parametres"]')).not.toBeNull();
    fixture.destroy();
  });

  it('signale aux mentors les demandes de mentorat en attente', () => {
    demandesEnAttente.set(3);
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(actualiserCompteur).toHaveBeenCalledOnce();
    expect(racine.querySelector('.badge-compteur')?.textContent?.trim()).toBe('3');
    expect(racine.querySelector('.barre-laterale a[href="/mentorat"]')?.textContent)
      .toContain('3 demandes en attente');
    expect(racine.querySelector('.menu-mobile a[href="/mentorat"] .compteur')?.textContent?.trim()).toBe('3');
  });

  it('relève les messages non lus et les affiche sur la messagerie', () => {
    messagesNonLus.set(4);
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(compteurMessages.demarrer).toHaveBeenCalledOnce();
    expect(racine.querySelector('.barre-laterale a[href="/messagerie"]')?.textContent).toContain('4 messages non lus');
    expect(racine.querySelector('.menu-mobile a[href="/messagerie"] .compteur')?.textContent?.trim()).toBe('4');
    fixture.destroy();
    expect(compteurMessages.arreter).toHaveBeenCalled();
  });

  it('n’allume qu’une rubrique du panneau mobile : le tableau de bord ne reste pas actif sur ses sous-pages', async () => {
    utilisateur.set({ role: 'ADMIN', nom: 'EPT', prenom: 'Admin' });
    const fixture = TestBed.createComponent(EspaceMembre);
    await TestBed.inject(Router).navigateByUrl('/admin/inscriptions');
    fixture.detectChanges();
    await fixture.whenStable();
    const racine = fixture.nativeElement as HTMLElement;

    expect([...racine.querySelectorAll('.menu-mobile a.actif')].map((lien) => lien.getAttribute('href'))).toEqual(['/admin/inscriptions']);
    expect([...racine.querySelectorAll('.barre-laterale nav a[aria-current="page"]')].map((lien) => lien.getAttribute('href')))
      .toEqual(['/admin/inscriptions']);
  });

  it('marque le bouton du compte comme page courante sur son propre profil, pas sur celui d’un autre', async () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    const routeur = TestBed.inject(Router);
    const bouton = () => (fixture.nativeElement as HTMLElement).querySelector('.bouton-compte-lateral');
    await routeur.navigateByUrl('/profil');
    fixture.detectChanges();
    expect(bouton()?.getAttribute('data-active')).toBe('true');
    await routeur.navigateByUrl('/profil/un-autre-membre');
    fixture.detectChanges();
    expect(bouton()?.getAttribute('data-active')).not.toBe('true');
  });

  it('relit le compte au chargement : statut et permissions ont pu changer depuis la connexion', () => {
    TestBed.createComponent(EspaceMembre).detectChanges();
    expect(resynchroniser).toHaveBeenCalledOnce();
  });

  it('range la navigation de l’administration par domaine, avec « Mon compte » à la place du profil', () => {
    utilisateur.set({ role: 'ADMIN', nom: 'EPT', prenom: 'Admin' });
    inscriptionsEnAttente.set(4);
    signalementsEnAttente.set(2);
    offresAVerifier.set(2);
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(actualiserInscriptions).toHaveBeenCalledOnce();
    expect(actualiserSignalements).toHaveBeenCalledOnce();
    expect(actualiserCompteur).not.toHaveBeenCalled();
    expect([...racine.querySelectorAll('.barre-laterale p-sidebar-group-label')].map((titre) => titre.textContent?.trim()))
      .toEqual(['Pilotage', 'Membres', 'Stages', 'Mobilités', 'Partenariats', 'Contenus', 'Système', 'Plateforme', 'À découvrir bientôt']);
    expect([...racine.querySelectorAll('.barre-laterale nav a')].map((lien) => lien.getAttribute('href'))).toEqual([
      '/admin', '/admin/inscriptions', '/admin/comptes', '/admin/passage-classe', '/admin/diplomes', '/admin/filieres',
      '/admin/stages/offres', '/admin/stages/declarations', '/admin/stages/suivi', '/admin/stages/sollicitations', '/admin/mobilites/offres', '/admin/mobilites/suivi', '/admin/mobilites/flux',
      '/admin/partenariats', '/admin/partenariats/conventions', '/admin/partenariats/accords',
      '/admin/publications', '/admin/signalements', '/admin/communautes', '/evenements', '/mentorat/gestion-programmes', '/admin/journal', '/annuaire', '/offres-emploi', '/partenaires',
    ]);
    expect(racine.querySelector('.barre-laterale a[href="/admin/signalements"]')?.textContent).toContain('2 signalements à examiner');
    expect(racine.querySelector('.barre-laterale a[href="/admin/inscriptions"]')?.textContent).toContain('4 inscriptions à examiner');
    expect(actualiserOffres).toHaveBeenCalledOnce();
    expect(racine.querySelector('.barre-laterale a[href="/admin/stages/offres"]')?.textContent).toContain('2 offres à vérifier');
    // La gestion des rôles existe déjà (Comptes) : elle n’est plus annoncée « à venir ».
    expect(racine.querySelector('.barre-laterale')?.textContent).not.toContain('Rôles et accès');
    // Le panneau mobile reprend les rubriques d'administration ; Annuaire et Événements sont dans la barre du bas.
    expect(racine.querySelector('.menu-mobile a[href="/admin/mon-compte"]')?.textContent?.trim()).toBe('Mon compte');
    expect([...racine.querySelectorAll('.menu-mobile a')].map((lien) => lien.getAttribute('href'))).toEqual([
      '/admin/mon-compte', '/admin', '/admin/inscriptions', '/admin/comptes', '/admin/passage-classe', '/admin/diplomes', '/admin/filieres',
      '/admin/stages/offres', '/admin/stages/declarations', '/admin/stages/suivi', '/admin/stages/sollicitations', '/admin/mobilites/offres', '/admin/mobilites/suivi', '/admin/mobilites/flux',
      '/admin/partenariats', '/admin/partenariats/conventions', '/admin/partenariats/accords',
      '/admin/publications', '/admin/signalements', '/admin/communautes', '/mentorat/gestion-programmes', '/admin/journal', '/offres-emploi', '/partenaires',
    ]);
    expect(racine.querySelector('.menu-mobile a[href="/admin/inscriptions"]')?.textContent).toContain('4 inscriptions à examiner');
    expect(racine.querySelectorAll('.navigation-mobile a')).toHaveLength(3);
    expect(racine.querySelector('.deconnexion-menu')).not.toBeNull();
  });

  it('relève les notifications tant que l’espace est affiché et montre la pastille', () => {
    notifications.nonLues.set(3);
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(notifications.demarrer).toHaveBeenCalledTimes(1);
    // Bureau : un bouton qui ouvre l’aperçu ; mobile : un lien vers la page des notifications.
    const bureau = racine.querySelector('.barre-outils .bouton-cloche');
    const mobile = racine.querySelector('.entete-mobile .bouton-cloche');
    expect(bureau?.tagName).toBe('BUTTON');
    expect(bureau?.getAttribute('aria-label')).toBe('Notifications, 3 non lues');
    expect(mobile?.getAttribute('href')).toBe('/notifications');

    fixture.destroy();
    expect(notifications.arreter).toHaveBeenCalledTimes(1);
  });
});

function simulerDialogueNatif(dialogue: HTMLDialogElement): void {
  dialogue.showModal = vi.fn(() => { dialogue.open = true; });
  dialogue.close = vi.fn(() => {
    dialogue.open = false;
    dialogue.dispatchEvent(new Event('close'));
  });
}
