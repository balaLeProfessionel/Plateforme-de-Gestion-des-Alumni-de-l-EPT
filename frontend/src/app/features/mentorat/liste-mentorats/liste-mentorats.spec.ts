import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { CompteurDemandesMentorat } from '../../../core/services/mentorat/compteur-demandes';
import { Mentorat, Page } from '../../../core/services/models/mentorat.model';
import { ListeMentorats, VueListeMentorats } from './liste-mentorats';

describe('ListeMentorats', () => {
  let fixture: ComponentFixture<ListeMentorats>;
  let http: HttpTestingController;
  const actualiser = vi.fn();
  let modifications: number;
  let totaux: number[];

  function demarrer(vue: VueListeMentorats): void {
    TestBed.configureTestingModule({
      imports: [ListeMentorats],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CompteurDemandesMentorat, useValue: { actualiser } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ListeMentorats);
    fixture.componentRef.setInput('vue', vue);
    modifications = 0;
    totaux = [];
    fixture.componentInstance.modifie.subscribe(() => modifications++);
    fixture.componentInstance.total.subscribe((total) => totaux.push(total));
    fixture.detectChanges();
  }

  beforeEach(() => actualiser.mockClear());
  afterEach(() => http.verify());

  it('permet au mentor de refuser avec un motif, prévient la page et actualise le compteur', async () => {
    demarrer(vue('MENTOR', ['EN_ATTENTE']));
    const liste = http.expectOne((req) => req.url === '/api/mentorat/mentorats');
    expect(liste.request.params.get('role')).toBe('MENTOR');
    expect(liste.request.params.getAll('statut')).toEqual(['EN_ATTENTE']);
    liste.flush(page([mentorat()]));
    await fixture.whenStable();

    const boutons = () => [...fixture.nativeElement.querySelectorAll('.actions button')] as HTMLButtonElement[];
    expect(boutons().map((bouton) => bouton.textContent?.trim())).toEqual(['Accepter', 'Refuser']);
    boutons()[1].click();
    fixture.detectChanges();

    const motif = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    motif.value = ' Agenda complet ';
    motif.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    boutons()[0].click();

    const refus = http.expectOne('/api/mentorat/mentorats/m1/refuser');
    expect(refus.request.body).toEqual({ motif: 'Agenda complet' });
    refus.flush({ ...mentorat(), statut: 'REFUSEE' });
    await fixture.whenStable();

    expect(actualiser).toHaveBeenCalledOnce();
    expect(modifications).toBe(1);
    expect(totaux).toEqual([1]);
  });

  it('se recharge quand la page signale un changement, et ne montre rien quand elle est vide', async () => {
    demarrer(vue('MENTOR', ['ACCEPTEE']));
    http.expectOne((req) => req.url === '/api/mentorat/mentorats').flush(page([mentorat()]));
    await fixture.whenStable();

    fixture.componentRef.setInput('actualisation', 1);
    fixture.detectChanges();
    http.expectOne((req) => req.url === '/api/mentorat/mentorats').flush(page([]));
    await fixture.whenStable();

    expect(totaux).toEqual([1, 0]);
    expect(fixture.nativeElement.querySelector('.liste')).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('affiche l’erreur métier quand le mentor est complet', async () => {
    demarrer(vue('MENTOR', ['EN_ATTENTE']));
    http.expectOne((req) => req.url === '/api/mentorat/mentorats').flush(page([mentorat()]));
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.actions .principal') as HTMLButtonElement).click();
    http.expectOne('/api/mentorat/mentorats/m1/accepter').flush(
      { message: 'Vous avez atteint votre nombre maximum de mentorés.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain('nombre maximum de mentorés');
  });

  it('rappelle le programme d’une demande rattachée, sans second lien', async () => {
    demarrer(vue('MENTOR', ['EN_ATTENTE']));
    http.expectOne((req) => req.url === '/api/mentorat/mentorats')
      .flush(page([{ ...mentorat(), programme: { id: 'prog1', titre: 'Orientation lycée 2026' } }]));
    await fixture.whenStable();
    fixture.detectChanges();

    const ligne = fixture.nativeElement.querySelector('.ligne') as HTMLElement;
    expect(ligne.querySelector('.programme')?.textContent).toContain('Orientation lycée 2026');
    expect(ligne.querySelectorAll('a.lien-etire')).toHaveLength(1);
  });

  it('propose à l’étudiant d’annuler une demande en attente', async () => {
    demarrer(vue('MENTORE', ['EN_ATTENTE']));
    http.expectOne((req) => req.url === '/api/mentorat/mentorats')
      .flush(page([{ ...mentorat(), monRole: 'MENTORE' }]));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h3')?.textContent).toContain('Awa Diop');
    const ligne = fixture.nativeElement.querySelector('.ligne') as HTMLElement;
    expect(ligne.classList).toContain('carte-cliquable');
    expect(ligne.querySelector('.explication')?.textContent).toContain('attend la réponse du mentor');
    expect(ligne.querySelector('.entete app-etiquette-role')?.textContent?.trim()).toBe('Alumni');
    expect([...ligne.querySelectorAll('a')].map((lien) => lien.getAttribute('href'))).toEqual(['/mentorat/suivi/m1']);
    expect(ligne.querySelector('.programme')).toBeNull();
    expect(ligne.querySelector('a.lien-etire')?.getAttribute('aria-label')).toBe('Mentorat avec Awa Diop, Data & IA');
    (fixture.nativeElement.querySelector('.actions button') as HTMLButtonElement).click();
    http.expectOne('/api/mentorat/mentorats/m1/annuler').flush({ ...mentorat(), statut: 'ANNULEE' });
    expect(modifications).toBe(1);
    expect(actualiser).not.toHaveBeenCalled();
  });
});

function mentorat(): Mentorat {
  return {
    id: 'm1',
    statut: 'EN_ATTENTE',
    domaine: { id: 'd1', code: 'DATA_IA', libelle: 'Data & IA' },
    objectif: 'Préparer mon stage',
    motifRefus: null,
    creeLe: '2026-10-02T10:00:00Z',
    reponduLe: null,
    clotureLe: null,
    mentor: { id: 'u1', nom: 'Diop', prenom: 'Awa', urlPhoto: null, posteActuel: 'Data Engineer', filiere: null, anneeSortie: 2016, role: 'ALUMNI' },
    mentore: { id: 'u2', nom: 'Ndiaye', prenom: 'Moussa', urlPhoto: null, posteActuel: null, filiere: 'GIT', anneeSortie: 2027, role: 'ETUDIANT' },
    monRole: 'MENTOR',
    programme: null,
  };
}

function page(contenu: Mentorat[]): Page<Mentorat> {
  return { contenu, page: 0, taille: 12, totalElements: contenu.length, totalPages: 1 };
}

function vue(role: VueListeMentorats['role'], statuts: VueListeMentorats['statuts']): VueListeMentorats {
  return { titre: 'Section', role, statuts };
}
