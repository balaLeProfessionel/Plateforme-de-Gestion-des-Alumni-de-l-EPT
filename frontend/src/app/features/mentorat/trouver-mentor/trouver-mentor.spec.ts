import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { Mentor, Page } from '../../../core/services/models/mentorat.model';
import { TrouverMentor } from './trouver-mentor';

describe('TrouverMentor', () => {
  let fixture: ComponentFixture<TrouverMentor>;
  let http: HttpTestingController;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    parametres = new BehaviorSubject(convertToParamMap({}));
    await TestBed.configureTestingModule({
      imports: [TrouverMentor],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametres } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
  });

  afterEach(() => http.verify());

  function demarrer(params: Record<string, string> = {}): void {
    parametres.next(convertToParamMap(params));
    fixture = TestBed.createComponent(TrouverMentor);
    fixture.detectChanges();
    http.expectOne('/api/mentorat/domaines').flush([
      { id: 'd1', code: 'DATA_IA', libelle: 'Data & IA' },
      { id: 'd2', code: 'CARRIERE_INSERTION', libelle: 'Carrière & insertion' },
    ]);
  }

  it('lit les critères dans l’URL et désactive les mentors complets ou déjà sollicités', async () => {
    demarrer({ domaine: 'd1', disponibles: 'oui' });
    const requete = http.expectOne((req) => req.url === '/api/mentorat/mentors');
    expect(requete.request.params.get('domaine')).toBe('d1');
    expect(requete.request.params.get('disponibles')).toBe('true');
    requete.flush(page([
      mentor({ profilId: 'p1', prenom: 'Awa' }),
      mentor({ profilId: 'p2', prenom: 'Moussa', placesRestantes: 0 }),
      mentor({ profilId: 'p3', prenom: 'Fatou', demandeEnCours: true }),
    ]));
    await fixture.whenStable();

    const boutons = [...fixture.nativeElement.querySelectorAll('.demander')] as HTMLButtonElement[];
    expect(boutons.map((bouton) => bouton.disabled)).toEqual([false, true, true]);
    expect(boutons[1].textContent).toContain('Complet');
    expect(boutons[2].textContent).toContain('Demande envoyée');
    expect(fixture.nativeElement.querySelector('[aria-pressed="true"]')?.textContent).toContain('Data & IA');
  });

  it('filtre par domaine en remplaçant l’entrée d’historique', async () => {
    demarrer();
    http.expectOne((req) => req.url === '/api/mentorat/mentors').flush(page([]));
    await fixture.whenStable();

    const domaine = [...fixture.nativeElement.querySelectorAll('.domaines button')]
      .find((bouton) => (bouton as HTMLElement).textContent?.includes('Carrière')) as HTMLButtonElement;
    domaine.click();

    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { domaine: 'd2' },
      replaceUrl: true,
    }));
  });

  it('envoie une demande et marque le mentor comme sollicité', async () => {
    demarrer();
    http.expectOne((req) => req.url === '/api/mentorat/mentors').flush(page([mentor({ profilId: 'p1', prenom: 'Awa' })]));
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.demander') as HTMLButtonElement).click();
    fixture.detectChanges();
    const objectif = fixture.nativeElement.querySelector('#demande-objectif') as HTMLTextAreaElement;
    objectif.value = 'Préparer mon stage';
    objectif.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.dialogue form') as HTMLFormElement)
      .dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();

    const envoi = http.expectOne('/api/mentorat/mentorats');
    expect(envoi.request.body).toEqual({ profilMentorId: 'p1', domaineId: 'd1', objectif: 'Préparer mon stage' });
    envoi.flush({ id: 'm1' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.confirmation')?.textContent).toContain('Awa Diop');
    expect((fixture.nativeElement.querySelector('.demander') as HTMLButtonElement).disabled).toBe(true);
  });
});

function mentor(valeurs: Partial<Mentor>): Mentor {
  return {
    profilId: 'p', utilisateurId: 'u', nom: 'Diop', prenom: 'Awa', urlPhoto: null,
    posteActuel: 'Data Engineer', filiere: 'Génie Informatique', anneeSortie: 2016,
    presentation: null, domaines: [{ id: 'd1', code: 'DATA_IA', libelle: 'Data & IA' }],
    disponible: true, placesRestantes: 2, demandeEnCours: false,
    ...valeurs,
  };
}

function page(contenu: Mentor[]): Page<Mentor> {
  return { contenu, page: 0, taille: 12, totalElements: contenu.length, totalPages: 1 };
}
