import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Mentor } from '../../../core/services/models/mentorat.model';
import { unMentor } from '../testing/donnees-mentorat';
import { CarteMentor } from './carte-mentor';

describe('CarteMentor', () => {
  let fixture: ComponentFixture<CarteMentor>;

  function afficher(mentor: Mentor): HTMLElement {
    TestBed.configureTestingModule({ imports: [CarteMentor], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(CarteMentor);
    fixture.componentRef.setInput('mentor', mentor);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('présente un mentor disponible et émet la demande au clic', () => {
    const racine = afficher(unMentor({ placesRestantes: 1 }));
    const demandes: Mentor[] = [];
    fixture.componentInstance.demander.subscribe((mentor) => demandes.push(mentor));

    expect(racine.querySelector('h2 a')?.getAttribute('href')).toBe('/profil/u1');
    expect(racine.querySelector('.carte')?.classList).toContain('carte-cliquable');
    expect(racine.querySelectorAll('a.lien-etire')).toHaveLength(1);
    expect(racine.textContent).toContain('Promo 2016 · Génie Informatique');
    expect(racine.querySelector('.bandeau app-etiquette-role')?.textContent?.trim()).toBe('Alumni');
    expect(racine.querySelector('.disponibilite')?.textContent).toContain('Disponible · 1 place');
    const bouton = racine.querySelector('.demander') as HTMLButtonElement;
    expect(bouton.disabled).toBe(false);
    expect(bouton.getAttribute('aria-label')).toBe('Demander un mentorat à Awa Diop');
    bouton.click();
    expect(demandes).toHaveLength(1);
  });

  it('désactive la demande quand ma limite de demandes en attente est atteinte', () => {
    const racine = afficher(unMentor());
    fixture.componentRef.setInput('limiteAtteinte', true);
    fixture.detectChanges();
    const demande = racine.querySelector('.demander') as HTMLButtonElement;
    expect(demande.disabled).toBe(true);
    expect(demande.textContent?.trim()).toBe('Limite de demandes atteinte');
    expect(racine.querySelector('.disponibilite')?.textContent).toContain('Disponible · 2 places');
  });

  it('montre le type d’un mentor qui n’est pas alumni, bandeau compris', () => {
    const racine = afficher(unMentor({ role: 'ETUDIANT' }));
    expect(racine.querySelector('.carte')?.getAttribute('data-role')).toBe('ETUDIANT');
    expect(racine.querySelector('.bandeau app-etiquette-role')?.textContent?.trim()).toBe('Étudiant');
  });

  it.each([
    [{ placesRestantes: 0 }, 'Complet', 'Complet'],
    [{ disponible: false }, 'Indisponible', 'Indisponible pour le moment'],
    [{ demandeEnCours: true }, 'Demande envoyée', 'Disponible · 2 places'],
  ])('désactive la demande et dit pourquoi (%o)', (etat, bouton, disponibilite) => {
    const racine = afficher(unMentor(etat));
    const demande = racine.querySelector('.demander') as HTMLButtonElement;
    expect(demande.disabled).toBe(true);
    expect(demande.textContent?.trim()).toBe(bouton);
    expect(racine.querySelector('.disponibilite')?.textContent).toContain(disponibilite);
  });

  it('limite les domaines affichés et annonce ceux qui sont masqués', () => {
    const domaines = ['A', 'B', 'C', 'D', 'E'].map((code) => ({ id: code, code, libelle: `Domaine ${code}` }));
    const racine = afficher(unMentor({ domaines }));
    const pastilles = [...racine.querySelectorAll('.domaines li')];
    expect(pastilles.map((li) => li.textContent?.trim())).toEqual(['Domaine A', 'Domaine B', 'Domaine C', '+2']);
    expect(pastilles[3].getAttribute('aria-label')).toBe('2 autres domaines');
  });

  it('affiche les initiales sans photo, puis après une photo en erreur', () => {
    let racine = afficher(unMentor());
    expect(racine.querySelector('.avatar')?.textContent?.trim()).toBe('AD');

    TestBed.resetTestingModule();
    racine = afficher(unMentor({ urlPhoto: '/api/photos/absente.png' }));
    racine.querySelector('.avatar img')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(racine.querySelector('.avatar img')).toBeNull();
    expect(racine.querySelector('.avatar')?.textContent?.trim()).toBe('AD');
  });

  it('n’affiche ni poste ni présentation quand ils sont absents', () => {
    const racine = afficher(unMentor({ posteActuel: null, presentation: null, anneeSortie: null, filiere: null }));
    expect(racine.querySelector('.poste')).toBeNull();
    expect(racine.querySelector('.presentation')).toBeNull();
    expect(racine.querySelector('.parcours')).toBeNull();
  });
});
