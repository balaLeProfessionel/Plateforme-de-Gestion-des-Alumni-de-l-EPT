import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { AnnuaireMembre } from '../../../core/services/models/annuaire.model';
import { EtatConversations } from '../etat-conversations';
import { NouvelleConversation } from './nouvelle-conversation';

const membre = (id: string, prenom: string, nom: string): AnnuaireMembre => ({
  id, prenom, nom, role: 'ALUMNI', statutCompte: 'ACTIF', urlPhoto: null, posteActuel: null, villeResidence: null,
  filiere: null, anneeSortie: 2018, organismeId: null, typeOrganisme: null,
});

describe('NouvelleConversation', () => {
  let fixture: ComponentFixture<NouvelleConversation>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;
  const etat = { actualiser: vi.fn() };

  beforeEach(async () => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
    etat.actualiser.mockClear();
    await TestBed.configureTestingModule({
      imports: [NouvelleConversation],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: EtatConversations, useValue: etat },
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi' }) } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(NouvelleConversation);
    fixture.componentRef.setInput('ouverte', true);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const racine = () => fixture.nativeElement as HTMLElement;

  /** Tape une recherche, attend la pause de saisie et répond avec ces membres. */
  async function rechercher(texte: string, membres: AnnuaireMembre[]): Promise<void> {
    const champ = racine().querySelector('input[type="search"]') as HTMLInputElement;
    champ.value = texte;
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 350));
    const requete = http.expectOne((req) => req.url === '/api/annuaire');
    expect(requete.request.params.get('recherche')).toBe(texte);
    requete.flush({ contenu: membres, page: 0, taille: 8, totalElements: membres.length, totalPages: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function choisir(nom: string): void {
    const bouton = [...racine().querySelectorAll('.propositions button')]
      .find((b) => b.textContent?.includes(nom)) as HTMLButtonElement;
    bouton.click();
    fixture.detectChanges();
  }

  const soumettre = () => racine().querySelector('button[type="submit"]') as HTMLButtonElement;

  it('ne me propose pas moi-même et ouvre la conversation directe avec le membre choisi', async () => {
    await rechercher('di', [membre('moi', 'Awa', 'Diop'), membre('u-2', 'Moussa', 'Diouf')]);
    expect(racine().querySelectorAll('.propositions button').length).toBe(1);
    expect(soumettre().disabled).toBe(true);

    choisir('Moussa Diouf');
    expect(soumettre().textContent?.trim()).toBe('Écrire à Moussa Diouf');
    soumettre().click();

    const requete = http.expectOne('/api/messagerie/conversations/directes');
    expect(requete.request.body).toEqual({ destinataireId: 'u-2' });
    requete.flush({ id: 'c-9' });
    await fixture.whenStable();

    expect(etat.actualiser).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/messagerie', 'c-9'], { state: { saisie: true } });
  });

  it('demande un nom pour créer un groupe avec plusieurs membres', async () => {
    await rechercher('di', [membre('u-2', 'Moussa', 'Diouf'), membre('u-3', 'Fatou', 'Dieng')]);
    choisir('Moussa Diouf');
    choisir('Fatou Dieng');
    expect(soumettre().textContent?.trim()).toBe('Créer le groupe');

    soumettre().click();
    await fixture.whenStable();
    fixture.detectChanges();
    http.expectNone('/api/messagerie/conversations/groupes');
    expect(racine().querySelector('#erreur-nom-groupe')?.textContent).toContain('Donnez un nom au groupe.');

    const nom = racine().querySelector('#nom-groupe') as HTMLInputElement;
    nom.value = 'Promo 2018';
    nom.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    soumettre().click();

    const requete = http.expectOne('/api/messagerie/conversations/groupes');
    expect(requete.request.body).toEqual({ nom: 'Promo 2018', membreIds: ['u-2', 'u-3'] });
    requete.flush({ id: 'g-1' });
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/messagerie', 'g-1'], { state: { saisie: true } });
  });
});
