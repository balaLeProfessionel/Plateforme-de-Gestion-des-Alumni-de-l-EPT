import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth-service';
import { OffreEmploi } from '../../../core/services/models/offre-emploi.model';
import { authEmploi, uneOffreEmploi, uneOffreGeree } from '../testing/donnees-offres-emploi';
import { MesOffresEmploi } from './mes-offres-emploi';

describe('MesOffresEmploi', () => {
  let fixture: ComponentFixture<MesOffresEmploi>;
  let http: HttpTestingController;

  const afficher = (offres: OffreEmploi[], role = 'ALUMNI') => {
    TestBed.configureTestingModule({ imports: [MesOffresEmploi], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: AuthService, useValue: authEmploi(role) }] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MesOffresEmploi);
    fixture.detectChanges();
    http.expectOne('/api/offres-emploi/mes-offres').flush(offres);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (zone: HTMLElement, texte: string) =>
    [...zone.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement | undefined;

  afterEach(() => http.verify());

  it('liste les offres avec leur statut, le motif de l’école, et ne propose rien pour une offre retirée', () => {
    const racine = afficher([
      uneOffreEmploi({ modifiable: true }),
      uneOffreEmploi({ id: 'e2', statut: 'RETIREE', motifDecision: 'Lien mort' }),
      uneOffreEmploi({ id: 'e3', expiree: true, modifiable: true }),
    ]);
    const lignes = [...racine.querySelectorAll('.ligne')] as HTMLElement[];
    expect(lignes[0].querySelector('.statut')?.textContent).toBe('Publiée');
    expect(lignes[0].querySelector('a[href="/offres-emploi/e1/modifier"]')).not.toBeNull();
    expect(lignes[1].querySelector('.motif')?.textContent).toContain('Lien mort');
    expect(bouton(lignes[1], 'Retirer')).toBeUndefined();
    expect(lignes[2].querySelector('.statut')?.textContent).toBe('Expirée');
  });

  it('retire une offre après confirmation', () => {
    const racine = afficher([uneOffreEmploi({ modifiable: true })]);
    const ligne = racine.querySelector('.ligne') as HTMLElement;
    bouton(ligne, 'Retirer')?.click();
    fixture.detectChanges();
    expect(ligne.querySelector('.confirmation')?.textContent).toContain('Les membres ne la verront plus.');
    bouton(ligne, 'Retirer l’offre')?.click();
    http.expectOne({ method: 'PATCH', url: '/api/offres-emploi/e1/retirer' }).flush(uneOffreEmploi({ statut: 'RETIREE' }));
    fixture.detectChanges();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('est retirée');
    expect(racine.querySelector('.ligne .statut')?.textContent).toBe('Retirée');
  });

  it('annonce la clôture des candidatures au retrait d’une offre gérée et garde le compteur', () => {
    const offre = uneOffreGeree({ modifiable: true, candidaturesConsultables: true, candidatures: { total: 3, aTraiter: 2 } });
    const racine = afficher([offre], 'ORGANISME');
    const ligne = racine.querySelector('.ligne') as HTMLElement;
    bouton(ligne, 'Retirer')?.click();
    fixture.detectChanges();
    expect(ligne.querySelector('.confirmation')?.textContent).toContain('passeront en non retenues, et leurs candidats seront prévenus');
    bouton(ligne, 'Retirer l’offre')?.click();
    http.expectOne({ method: 'PATCH', url: '/api/offres-emploi/g1/retirer' })
      .flush({ ...offre, statut: 'RETIREE', modifiable: false, candidatures: null });
    fixture.detectChanges();
    expect(racine.querySelector('.candidatures .nombre')?.textContent).toBe('3');
    expect(racine.querySelector('.candidatures .a-traiter')).toBeNull();
  });

  it('invite à relayer une première offre', () => {
    expect(afficher([]).querySelector('.etat h2')?.textContent).toContain('Vous n’avez relayé aucune offre');
  });

  it('montre à un organisme ses offres publiées, avec la modification d’une offre gérée', () => {
    const racine = afficher([uneOffreGeree({ modifiable: true })], 'ORGANISME');
    expect(racine.querySelector('h1')?.textContent).toContain('Mes offres publiées');
    expect(racine.querySelector('a[href="/offres-emploi/publier"]')).not.toBeNull();
    expect(racine.querySelector('a[href="/offres-emploi/g1/modifier-offre"]')).not.toBeNull();
  });

  it('mène l’organisme aux candidatures reçues et signale un recrutement clôturé', () => {
    const racine = afficher([uneOffreGeree({ candidaturesConsultables: true, cloturee: true })], 'ORGANISME');
    const lien = racine.querySelector('a.candidatures[href="/offres-emploi/g1/candidatures"]');
    expect(lien?.getAttribute('aria-label')).toBe('Candidatures reçues pour Ingénieur réseaux');
    expect(racine.querySelector('.ligne .statut')?.textContent).toBe('Recrutement clôturé');
  });

  it('affiche le nombre de candidatures et celles à traiter', () => {
    const racine = afficher([uneOffreGeree({ candidaturesConsultables: true, candidatures: { total: 3, aTraiter: 2 } })], 'ORGANISME');
    const lien = racine.querySelector('a.candidatures');
    expect(lien?.querySelector('.nombre')?.textContent).toBe('3');
    expect(lien?.querySelector('.a-traiter')?.textContent).toBe('2 à traiter');
    expect(lien?.getAttribute('aria-label')).toBe('Candidatures reçues pour Ingénieur réseaux : 3, dont 2 à traiter');
  });

  it('invite un organisme à publier une première offre', () => {
    expect(afficher([], 'ORGANISME').querySelector('.etat h2')?.textContent).toContain('Vous n’avez publié aucune offre');
  });
});
