import { registerLocaleData } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { CommunauteADecouvrir, Conversation } from '../../../core/services/models/messagerie.model';
import { EtatCommunautes } from '../etat-communautes';
import { ListeCommunautes } from './liste-communautes';

registerLocaleData(localeFr);

const promo: Conversation = {
  id: 'p-2015', type: 'GROUPE', nom: 'Promo 2015', interlocuteur: null, urlPhoto: null, nombreParticipants: 40,
  monRole: 'MEMBRE', ecriture: 'OUVERTE', nombreNonLus: 2, dernierMessageLe: '2026-11-14T10:00:00Z', categorie: 'PROMO',
  dernierMessage: { auteurId: 'x', auteurNom: 'Moussa Ndiaye', contenu: 'a rejoint la communauté.', supprime: false,
    envoyeLe: '2026-11-14T10:00:00Z', systeme: true },
};
const dakar: CommunauteADecouvrir = {
  id: 'v-dakar', nom: 'EPT à Dakar', description: 'Afterworks', urlPhoto: null, categorie: 'VILLE', acces: 'OUVERTE',
  nombreMembres: 12, membresDeMaPromo: 3,
};

describe('ListeCommunautes', () => {
  const miennes = signal<Conversation[]>([]);
  const aDecouvrir = signal<CommunauteADecouvrir[]>([]);
  const etat = {
    miennes, aDecouvrir, chargee: signal(true), chargement: signal(false), erreur: signal<string | null>(null),
    actualiser: vi.fn(), rejoindre: vi.fn(),
  };

  beforeEach(() => {
    miennes.set([]);
    aDecouvrir.set([]);
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [ListeCommunautes],
      providers: [
        provideRouter([]),
        { provide: EtatCommunautes, useValue: etat },
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi' }) } },
      ],
    });
  });

  function rendu(): HTMLElement {
    const fixture = TestBed.createComponent(ListeCommunautes);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('liste mes communautés avec leur catégorie, l’arrivée d’un membre et les non-lus', () => {
    miennes.set([promo]);
    const lien = rendu().querySelector('a[href="/messagerie/p-2015"]') as HTMLAnchorElement;

    expect(lien.classList).toContain('non-lue');
    // Personne n’a encore écrit (une arrivée) : la ligne présente la communauté.
    expect(lien.querySelector('.apercu')?.textContent).toBe('Promo · 40 membres');
    expect(lien.querySelector('.apercu')?.classList).toContain('presentation');
    expect(lien.textContent).toContain('2 messages non lus');
    expect(lien.querySelector('app-avatar-groupe .pi-graduation-cap')).not.toBeNull();
  });

  it('distingue une communauté sur demande, sans bouton pour la rejoindre', () => {
    aDecouvrir.set([{ ...dakar, id: 'i-mentors', nom: 'Mentors', categorie: 'INTERET', acces: 'SUR_DEMANDE', membresDeMaPromo: 0 }]);
    const carte = rendu().querySelector('.decouvertes .carte') as HTMLElement;

    expect(carte.querySelector('.rejoindre')).toBeNull();
    expect(carte.querySelector('.sur-demande')?.textContent?.trim()).toBe('Sur demande');
    expect(carte.querySelector('app-avatar-groupe .pi-heart')).not.toBeNull();
    expect(carte.querySelector('.ma-promo')).toBeNull();
  });

  it('montre le dernier vrai message, et redonne la catégorie aux lecteurs d’écran', () => {
    miennes.set([{ ...promo, dernierMessage: { ...promo.dernierMessage!, contenu: 'Bonjour à tous', systeme: false } }]);
    const lien = rendu().querySelector('a[href="/messagerie/p-2015"]') as HTMLAnchorElement;

    expect(lien.querySelector('.apercu')?.textContent).toBe('Moussa Ndiaye : Bonjour à tous');
    expect(lien.querySelector('.ligne-bas .sr-only')?.textContent).toBe('Promo : ');
  });

  it('invite à compléter le profil quand je n’ai aucune communauté', () => {
    expect(rendu().querySelector('.aide a[href="/profil"]')).not.toBeNull();
  });

  it('montre combien de ma promo sont dans une communauté à découvrir, et l’ouvre une fois rejointe', () => {
    aDecouvrir.set([dakar]);
    etat.rejoindre.mockReturnValue(of({ id: 'v-dakar' }));
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const racine = rendu();

    expect(racine.querySelector('.decouvertes .details')?.textContent).toContain('12 membres · 3 de votre promo');
    (racine.querySelector('button[aria-label="Rejoindre EPT à Dakar"]') as HTMLButtonElement).click();

    expect(etat.rejoindre).toHaveBeenCalledWith('v-dakar');
    expect(navigation).toHaveBeenCalledWith(['/messagerie', 'v-dakar']);
  });

  it('propose de revenir dans sa promo quittée', () => {
    aDecouvrir.set([{ ...dakar, id: 'p-2015', nom: 'Promo 2015', categorie: 'PROMO' }]);
    etat.rejoindre.mockReturnValue(of({ id: 'p-2015' }));
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const racine = rendu();

    const revenir = racine.querySelector('button[aria-label="Revenir dans Promo 2015"]') as HTMLButtonElement;
    expect(revenir.textContent?.trim()).toBe('Revenir');
    // Tous les membres d’une promo en sont : inutile de le dire.
    expect(racine.querySelector('.ma-promo')).toBeNull();
    revenir.click();
    expect(etat.rejoindre).toHaveBeenCalledWith('p-2015');
  });

  it('cherche sans tenir compte des accents, dans le nom, la catégorie et la description', async () => {
    miennes.set([promo, { ...promo, id: 'v-thies', nom: 'EPT à Thiès', categorie: 'VILLE' }]);
    aDecouvrir.set([dakar, { ...dakar, id: 'i-data', nom: 'Data et IA', categorie: 'INTERET', description: 'Science des données' }]);
    const fixture = TestBed.createComponent(ListeCommunautes);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const chercher = async (texte: string) => {
      const champ = racine.querySelector('#recherche-communautes') as HTMLInputElement;
      champ.value = texte;
      champ.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
    };
    const noms = () => [...racine.querySelectorAll('.nom')].map((nom) => nom.textContent?.trim());

    await chercher('thies');
    expect(noms()).toEqual(['EPT à Thiès']);
    // Une section sans résultat s’efface pendant la recherche.
    expect(racine.querySelector('#titre-a-decouvrir')).toBeNull();
    expect(racine.querySelector('[role="status"]')?.textContent).toBe('1 communauté trouvée.');

    await chercher('DONNÉES');
    expect(noms()).toEqual(['Data et IA']);
    await chercher('promo');
    expect(noms()).toEqual(['Promo 2015']);

    await chercher('rugby');
    expect(racine.querySelector('.etat.vide p')?.textContent).toBe('Aucune communauté ne correspond à « rugby ».');
    const effacer = [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Effacer la recherche')!;
    effacer.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(noms()).toHaveLength(4);
    expect(document.activeElement?.id).toBe('recherche-communautes');
  });

  it('affiche le refus du serveur sous la communauté', () => {
    aDecouvrir.set([dakar]);
    etat.rejoindre.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409, error: { message: 'Cette communauté se rejoint sur demande.' },
    })));
    const fixture = TestBed.createComponent(ListeCommunautes);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    (racine.querySelector('.rejoindre') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(racine.querySelector('.erreur[role="alert"]')?.textContent).toBe('Cette communauté se rejoint sur demande.');
  });
});
