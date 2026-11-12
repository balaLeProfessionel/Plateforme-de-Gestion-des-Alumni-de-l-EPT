import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MonStage, Rapport } from '../../../../core/services/models/stage.model';
import { RapportStage } from './rapport-stage';

function unStage(rapport: Rapport): MonStage {
  return {
    id: 's1', offreId: null, sujet: 'Portail client', organisme: 'Kër Data', typeStage: 'PFE', lieu: null,
    dateDebut: '2026-02-01', dateFin: '2026-06-30', confirmeLe: '2026-01-10T10:00:00Z', statut: 'CONFIRME', motif: null, declare: false, rapport,
  };
}

describe('RapportStage', () => {
  let fixture: ComponentFixture<RapportStage>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RapportStage], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RapportStage);
  });

  afterEach(() => http.verify());

  const element = () => fixture.nativeElement as HTMLElement;
  const choisir = (fichier: File) => {
    const champ = element().querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(champ, 'files', { value: [fichier], configurable: true });
    champ.dispatchEvent(new Event('change'));
  };

  it('dépose un PDF avant la date limite et refuse un autre format', async () => {
    fixture.componentRef.setInput('stage', unStage({ dateLimite: '2026-12-15', nomFichier: null, deposeLe: null, etat: 'ATTENDU', depotOuvert: true }));
    await fixture.whenStable();
    expect(element().textContent).toContain('au plus tard le');

    choisir(new File(['x'], 'rapport.docx', { type: 'application/msword' }));
    await fixture.whenStable();
    expect(element().querySelector('[role="alert"]')?.textContent).toContain('fichier PDF');

    choisir(new File(['%PDF-1.4'], 'rapport.pdf', { type: 'application/pdf' }));
    const requete = http.expectOne('/api/stages/suivi/s1/rapport');
    expect(requete.request.body).toBeInstanceOf(FormData);
    requete.flush({ dateLimite: '2026-12-15', nomFichier: 'rapport.pdf', deposeLe: '2026-11-12T10:00:00Z', etat: 'DEPOSE', depotOuvert: true });
    await fixture.whenStable();
    expect(element().querySelector('[role="status"]')?.textContent).toContain('Votre rapport a été déposé.');
    expect(element().querySelector('label')?.textContent).toContain('Remplacer le rapport');
  });

  it('annonce un dépôt fermé sans rapport', async () => {
    fixture.componentRef.setInput('stage', unStage({ dateLimite: '2026-10-01', nomFichier: null, deposeLe: null, etat: 'EN_RETARD', depotOuvert: false }));
    await fixture.whenStable();
    expect(element().textContent).toContain('Dépôt fermé depuis le');
    expect(element().querySelector('input[type="file"]')).toBeNull();
  });
});
