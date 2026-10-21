import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { CompteurDemandesMentorat } from '../../../core/services/mentorat/compteur-demandes';
import { Mentorat, Page } from '../../../core/services/models/mentorat.model';
import { ListeMentorats, VueListeMentorats } from './liste-mentorats';

describe('ListeMentorats', () => {
  let fixture: ComponentFixture<ListeMentorats>;
  let http: HttpTestingController;
  const actualiser = vi.fn();

  function demarrer(vue: VueListeMentorats): void {
    TestBed.configureTestingModule({
      imports: [ListeMentorats],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { vue } } } },
        { provide: CompteurDemandesMentorat, useValue: { actualiser } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ListeMentorats);
    fixture.detectChanges();
  }

  beforeEach(() => actualiser.mockClear());
  afterEach(() => http.verify());

  it('permet au mentor de refuser avec un motif puis recharge la liste et le compteur', async () => {
    demarrer({ role: 'MENTOR', statuts: ['EN_ATTENTE'], titreVide: 'Vide', texteVide: '' });
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
    http.expectOne((req) => req.url === '/api/mentorat/mentorats').flush(page([]));
    await fixture.whenStable();

    expect(actualiser).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Vide');
  });

  it('affiche l’erreur métier quand le mentor est complet', async () => {
    demarrer({ role: 'MENTOR', statuts: ['EN_ATTENTE'], titreVide: 'Vide', texteVide: '' });
    http.expectOne((req) => req.url === '/api/mentorat/mentorats').flush(page([mentorat()]));
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.actions .principal') as HTMLButtonElement).click();
    http.expectOne('/api/mentorat/mentorats/m1/accepter').flush(
      { message: 'Vous avez atteint votre nombre maximum de mentorés.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain('nombre maximum de mentorés');
  });

  it('propose à l’étudiant d’annuler une demande en attente', async () => {
    demarrer({ role: 'MENTORE', statuts: ['EN_ATTENTE'], titreVide: 'Vide', texteVide: '' });
    http.expectOne((req) => req.url === '/api/mentorat/mentorats')
      .flush(page([{ ...mentorat(), monRole: 'MENTORE' }]));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Awa Diop');
    const ligne = fixture.nativeElement.querySelector('.ligne') as HTMLElement;
    expect(ligne.classList).toContain('carte-cliquable');
    expect([...ligne.querySelectorAll('a')].map((lien) => lien.getAttribute('href'))).toEqual(['/mentorat/suivi/m1']);
    expect(ligne.querySelector('a.lien-etire')?.getAttribute('aria-label')).toBe('Mentorat avec Awa Diop, Data & IA');
    (fixture.nativeElement.querySelector('.actions button') as HTMLButtonElement).click();
    http.expectOne('/api/mentorat/mentorats/m1/annuler').flush({ ...mentorat(), statut: 'ANNULEE' });
    http.expectOne((req) => req.url === '/api/mentorat/mentorats').flush(page([]));
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
    mentor: { id: 'u1', nom: 'Diop', prenom: 'Awa', urlPhoto: null, posteActuel: 'Data Engineer', filiere: null, anneeSortie: 2016 },
    mentore: { id: 'u2', nom: 'Ndiaye', prenom: 'Moussa', urlPhoto: null, posteActuel: null, filiere: 'GIT', anneeSortie: 2027 },
    monRole: 'MENTOR',
    programme: null,
  };
}

function page(contenu: Mentorat[]): Page<Mentorat> {
  return { contenu, page: 0, taille: 12, totalElements: contenu.length, totalPages: 1 };
}
