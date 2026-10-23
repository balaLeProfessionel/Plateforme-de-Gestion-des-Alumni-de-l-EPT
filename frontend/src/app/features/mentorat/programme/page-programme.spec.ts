import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../../core/services/mentorat/compteur-demandes';
import { Mentor, Page, Programme } from '../../../core/services/models/mentorat.model';
import { simulerDialogue, unMentor, unProgramme } from '../testing/donnees-mentorat';
import { PageProgramme } from './page-programme';

describe('PageProgramme', () => {
  let fixture: ComponentFixture<PageProgramme>;
  let http: HttpTestingController;
  let racine: HTMLElement;
  const utilisateur = signal<{ id: string; role: string } | null>({ id: 'moi', role: 'ALUMNI' });

  function afficher(role = 'ALUMNI'): void {
    simulerDialogue();
    utilisateur.set({ id: 'moi', role });
    TestBed.configureTestingModule({
      imports: [PageProgramme],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: new BehaviorSubject(convertToParamMap({ id: 'p1' })) } },
        { provide: AuthService, useValue: { utilisateur } },
        { provide: CompteurDemandesMentorat, useValue: { limiteAtteinte: computed(() => false), actualiser: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PageProgramme);
    racine = fixture.nativeElement;
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  async function repondre(programme: Programme, offre: boolean | null, mentors: Mentor[] = []): Promise<void> {
    if (offre !== null) {
      const requete = http.expectOne('/api/mentorat/profil');
      if (offre) requete.flush({ id: 'pm', presentation: null, disponible: true, capaciteMax: 2, mentoresActifs: 0, domaines: [] });
      else requete.flush({ message: 'introuvable' }, { status: 404, statusText: 'Not Found' });
    }
    http.expectOne('/api/mentorat/programmes/p1').flush(programme);
    await fixture.whenStable();
    if (programme.statut !== 'BROUILLON') {
      const recherche = http.expectOne((req) => req.url === '/api/mentorat/mentors');
      expect(recherche.request.params.get('programme')).toBe('p1');
      recherche.flush(page(mentors));
    }
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const bouton = (texte: string) => [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte);

  it('présente le programme, ses étapes et ses mentors volontaires', async () => {
    afficher();
    await repondre(unProgramme({ statut: 'OUVERT', nombreMentors: 1 }), true, [unMentor()]);

    expect(racine.querySelector('h1')?.textContent).toContain('Orientation lycée 2026');
    expect([...racine.querySelectorAll('.etapes strong')].map((e) => e.textContent)).toEqual(['Premier échange', 'Visite de l’EPT']);
    expect(racine.querySelectorAll('app-carte-mentor')).toHaveLength(1);

    // La demande faite depuis cette page est rattachée au programme.
    (racine.querySelector('app-carte-mentor button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine.querySelector('app-dialogue-demande .programme')?.textContent).toContain('Orientation lycée 2026');
    expect(racine.querySelector('.lien-gestion')?.getAttribute('href')).toBe('/mentorat/gestion-programmes/p1');
  });

  it('permet à un membre qui propose du mentorat de participer puis de se retirer', async () => {
    afficher();
    await repondre(unProgramme({ statut: 'OUVERT', gerable: false }), true);
    expect(racine.querySelector('.lien-gestion')).toBeNull();

    bouton('Je participe comme mentor')?.click();
    http.expectOne((r) => r.method === 'POST' && r.url === '/api/mentorat/programmes/p1/participation')
      .flush(unProgramme({ statut: 'OUVERT', jeParticipe: true, nombreMentors: 2 }));
    await fixture.whenStable();
    http.expectOne((req) => req.url === '/api/mentorat/mentors').flush(page([unMentor()]));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('mentor volontaire');
    // Ma carte n’est pas listée (on ne se sollicite pas soi-même) : pas de « aucun mentor » contradictoire.
    expect(racine.querySelector('.vide')).toBeNull();

    // Quitter demande une confirmation : les demandes en attente du programme seront annulées.
    bouton('Ne plus participer')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('.confirmation')?.textContent).toContain('Vos demandes en attente dans ce programme seront annulées');
    bouton('Rester volontaire')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('.confirmation')).toBeNull();
    bouton('Ne plus participer')?.click();
    fixture.detectChanges();
    bouton('Quitter le programme')?.click();
    http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/mentorat/programmes/p1/participation')
      .flush(unProgramme({ statut: 'OUVERT', jeParticipe: false }));
    await fixture.whenStable();
    http.expectOne((req) => req.url === '/api/mentorat/mentors').flush(page([]));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(bouton('Je participe comme mentor')).toBeDefined();
  });

  it('dit au mentor qu’il est le seul volontaire plutôt que « aucun mentor »', async () => {
    afficher();
    await repondre(unProgramme({ statut: 'OUVERT', jeParticipe: true, nombreMentors: 1 }), true, []);
    expect(racine.querySelector('.vide')?.textContent).toContain('Vous êtes pour l’instant le seul mentor volontaire.');
  });

  it('ferme un programme ouvert dont la date de fin est passée', async () => {
    afficher();
    await repondre(unProgramme({ statut: 'OUVERT', termine: true, dateFin: '2026-06-30' }), true);
    expect(racine.textContent).toMatch(/Ce programme est terminé depuis le 30 (juin|June) 2026/);
    expect(bouton('Je participe comme mentor')).toBeUndefined();
    expect(racine.querySelector('app-carte-mentor')).toBeNull();
  });

  it('invite à proposer du mentorat avant de participer', async () => {
    afficher();
    await repondre(unProgramme({ statut: 'OUVERT' }), false);
    expect(bouton('Je participe comme mentor')).toBeUndefined();
    expect(racine.querySelector('.aide a')?.getAttribute('href')).toBe('/mentorat/offre');
  });

  it('ne propose ni participation ni demande quand le programme n’est plus ouvert', async () => {
    afficher();
    await repondre(unProgramme({ statut: 'EN_COURS' }), true);
    expect(bouton('Je participe comme mentor')).toBeUndefined();
    expect(racine.textContent).toContain('n’accepte plus de nouveaux mentorats');
    expect(racine.querySelector('app-carte-mentor')).toBeNull();
  });

  it('n’offre pas la participation à un compte d’organisme', async () => {
    afficher('ORGANISME');
    await repondre(unProgramme({ statut: 'OUVERT', gerable: false }), null);
    expect(bouton('Je participe comme mentor')).toBeUndefined();
  });

  it('explique qu’un programme est introuvable', async () => {
    afficher();
    http.expectOne('/api/mentorat/profil').flush({}, { status: 404, statusText: 'Not Found' });
    http.expectOne('/api/mentorat/programmes/p1').flush({ message: 'introuvable' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Ce programme est introuvable.');
  });
});

function page(contenu: Mentor[]): Page<Mentor> {
  return { contenu, page: 0, taille: 24, totalElements: contenu.length, totalPages: 1 };
}
