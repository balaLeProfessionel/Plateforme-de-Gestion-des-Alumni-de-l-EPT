import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { CandidatureRecueEmploi, OffreEmploi } from '../../../core/services/models/offre-emploi.model';
import { uneCandidatureRecue, uneOffreGeree } from '../testing/donnees-offres-emploi';
import { CandidaturesOffreEmploi } from './candidatures-offre-emploi';

describe('CandidaturesOffreEmploi', () => {
  let fixture: ComponentFixture<CandidaturesOffreEmploi>;
  let http: HttpTestingController;

  const trois = (): CandidatureRecueEmploi[] => [
    uneCandidatureRecue(),
    uneCandidatureRecue({
      id: 'r2', statut: 'ENTRETIEN', statutsSuivants: ['RETENUE', 'NON_RETENUE'], envoyeeLe: '2026-11-26T09:00:00',
      candidat: { ...uneCandidatureRecue().candidat, id: 'u2', prenom: 'Moussa', nom: 'Ba' },
    }),
    uneCandidatureRecue({
      id: 'r3', statut: 'NON_RETENUE', statutsSuivants: [], envoyeeLe: '2026-11-24T09:00:00',
      candidat: { ...uneCandidatureRecue().candidat, id: 'u3', prenom: 'Fatou', nom: 'Sarr' },
    }),
  ];
  const ouvrir = () => {
    TestBed.configureTestingModule({
      imports: [CandidaturesOffreEmploi],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'g1' }) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CandidaturesOffreEmploi);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const repondre = (offre: OffreEmploi, candidatures: CandidatureRecueEmploi[]) => {
    http.expectOne('/api/offres-emploi/g1').flush(offre);
    http.expectOne('/api/offres-emploi/g1/candidatures').flush(candidatures);
    fixture.detectChanges();
  };
  const afficher = (offre = uneOffreGeree({ candidaturesConsultables: true }), candidatures = trois()) => {
    const racine = ouvrir();
    repondre(offre, candidatures);
    return racine;
  };
  const noms = (racine: HTMLElement) => [...racine.querySelectorAll('.liste h2')].map((h) => h.textContent?.trim());
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement | undefined;

  afterEach(() => http.verify());

  it('liste les candidatures, les plus récentes d’abord, avec un compteur par statut', () => {
    const racine = afficher();
    expect(racine.querySelector('.introduction a')?.textContent).toBe('Ingénieur réseaux');
    expect(noms(racine)).toEqual(['Moussa Ba', 'Awa Diop', 'Fatou Sarr']);
    expect([...racine.querySelectorAll('.filtres button')].map((b) => b.textContent?.trim()))
      .toEqual(['Toutes (3)', 'Reçue (1)', 'Entretien (1)', 'Non retenue (1)']);
  });

  it('filtre par statut et trie par nom ou par ancienneté', () => {
    const racine = afficher();
    const entretien = bouton(racine, 'Entretien (1)') as HTMLButtonElement;
    entretien.click();
    fixture.detectChanges();
    expect(entretien.getAttribute('aria-pressed')).toBe('true');
    expect(noms(racine)).toEqual(['Moussa Ba']);
    expect(racine.querySelector('.resume')?.textContent).toContain('1 candidature affichée');

    bouton(racine, 'Toutes (3)')?.click();
    const tri = racine.querySelector('#tri-candidatures') as HTMLSelectElement;
    tri.value = 'nom';
    tri.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(noms(racine)).toEqual(['Moussa Ba', 'Awa Diop', 'Fatou Sarr']);
    tri.value = 'anciennes';
    tri.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(noms(racine)).toEqual(['Fatou Sarr', 'Awa Diop', 'Moussa Ba']);
  });

  it('clôture le recrutement après confirmation, puis recharge les candidatures', () => {
    const racine = afficher();
    bouton(racine, 'Clôturer le recrutement')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('.confirmation')?.textContent).toContain('2 candidatures sans décision passeront en non retenue');
    bouton(racine, 'Clôturer le recrutement')?.click();
    http.expectOne({ method: 'POST', url: '/api/offres-emploi/g1/cloturer' }).flush({ nonRetenues: 2 });
    const closes = trois().map((c) => ({ ...c, statut: 'NON_RETENUE' as const, statutsSuivants: [] }));
    repondre(uneOffreGeree({ candidaturesConsultables: true, cloturee: true }), closes);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('2 candidatures sans décision sont passées en non retenue');
    expect(racine.querySelector('.cloture')).toBeNull();
    expect(racine.querySelector('.introduction')?.textContent).toContain('recrutement clôturé');
    expect(racine.querySelector('.decisions')).toBeNull();
  });

  it('montre le refus de la clôture sans fermer la confirmation', () => {
    const racine = afficher();
    bouton(racine, 'Clôturer le recrutement')?.click();
    fixture.detectChanges();
    bouton(racine, 'Clôturer le recrutement')?.click();
    http.expectOne('/api/offres-emploi/g1/cloturer')
      .flush({ message: 'Le recrutement de cette offre est déjà clôturé.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(racine.querySelector('.confirmation [role="alert"]')?.textContent).toContain('déjà clôturé');
  });

  it('annonce une offre sans candidature', () => {
    const racine = afficher(uneOffreGeree({ candidaturesConsultables: true }), []);
    expect(racine.querySelector('.etat h2')?.textContent).toContain('Aucune candidature pour l’instant');
    expect(racine.querySelector('.filtres')).toBeNull();
  });

  it('dit qu’une offre introuvable ou d’un autre organisme n’est pas consultable', () => {
    const racine = ouvrir();
    http.expectOne('/api/offres-emploi/g1').flush(uneOffreGeree());
    http.expectOne('/api/offres-emploi/g1/candidatures')
      .flush({ message: 'Cette offre d’emploi est introuvable.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('vous n’en traitez pas les candidatures');
  });
});
