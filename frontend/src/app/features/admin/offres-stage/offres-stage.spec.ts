import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { CompteurOffresAVerifier } from '../../../core/services/stages/compteur-offres';
import { pageDOffres, uneOffre } from '../../stages/testing/donnees-stages';
import { OffresStage } from './offres-stage';

describe('OffresStage (administration)', () => {
  let fixture: ComponentFixture<OffresStage>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;
  const actualiserCompteur = vi.fn();

  const afficher = (params: Record<string, string> = {}) => {
    TestBed.configureTestingModule({
      imports: [OffresStage],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: new BehaviorSubject(convertToParamMap(params)) } },
        { provide: CompteurOffresAVerifier, useValue: { actualiser: actualiserCompteur } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(OffresStage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (zone: HTMLElement, texte: string) =>
    [...zone.querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement;
  const soumise = uneOffre({ statut: 'SOUMISE', titre: 'Technicien réseau' });

  afterEach(() => http.verify());

  it('ouvre la file à vérifier et publie une offre', () => {
    const racine = afficher();
    const requete = http.expectOne((r) => r.url === '/api/admin/stages/offres');
    expect(requete.request.params.get('statut')).toBe('SOUMISE');
    requete.flush(pageDOffres([soumise]));
    fixture.detectChanges();
    expect(bouton(racine, 'À vérifier').getAttribute('aria-pressed')).toBe('true');

    bouton(racine, 'Publier').click();
    http.expectOne({ method: 'PATCH', url: '/api/admin/stages/offres/o1/publier' }).flush(uneOffre());
    http.expectOne((r) => r.url === '/api/admin/stages/offres').flush(pageDOffres([]));
    fixture.detectChanges();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('« Technicien réseau » est publiée');
    expect(actualiserCompteur).toHaveBeenCalled();
    expect(racine.querySelector('.etat h2')?.textContent).toContain('Aucune offre à vérifier');
  });

  it('exige un motif pour refuser, puis l’envoie', () => {
    const racine = afficher();
    http.expectOne((r) => r.url === '/api/admin/stages/offres').flush(pageDOffres([soumise]));
    fixture.detectChanges();
    bouton(racine, 'Refuser…').click();
    fixture.detectChanges();
    bouton(racine, 'Refuser l’offre').click();
    fixture.detectChanges();
    expect(racine.querySelector('.decision [role="alert"]')?.textContent).toContain('Le motif est obligatoire');

    const motif = racine.querySelector('textarea') as HTMLTextAreaElement;
    motif.value = 'Offre d’emploi, pas de stage';
    motif.dispatchEvent(new Event('input'));
    bouton(racine, 'Refuser l’offre').click();
    const requete = http.expectOne({ method: 'PATCH', url: '/api/admin/stages/offres/o1/refuser' });
    expect(requete.request.body).toEqual({ motif: 'Offre d’emploi, pas de stage' });
    requete.flush(uneOffre({ statut: 'REFUSEE' }));
    http.expectOne((r) => r.url === '/api/admin/stages/offres').flush(pageDOffres([]));
    fixture.detectChanges();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('L’organisme reçoit le motif par e-mail');
  });

  it('propose le retrait d’une offre publiée et change d’onglet par l’URL', () => {
    const racine = afficher({ statut: 'PUBLIEE' });
    http.expectOne((r) => r.url === '/api/admin/stages/offres' && r.params.get('statut') === 'PUBLIEE').flush(pageDOffres([uneOffre()]));
    fixture.detectChanges();
    expect(bouton(racine, 'Retirer…')).toBeDefined();
    expect(bouton(racine, 'Publier')).toBeUndefined();
    bouton(racine, 'Toutes').click();
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: { statut: 'toutes' } }));
  });
});
