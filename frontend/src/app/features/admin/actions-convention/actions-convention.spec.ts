import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Convention } from '../../../core/services/models/partenariat.model';
import { uneConvention } from '../../partenariats/testing/donnees-partenariat';
import { ActionsConvention } from './actions-convention';

describe('ActionsConvention', () => {
  let fixture: ComponentFixture<ActionsConvention>;
  let http: HttpTestingController;
  let emis: { convention: Convention; message: string }[];

  const afficher = (convention: Convention) => {
    TestBed.configureTestingModule({ imports: [ActionsConvention], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ActionsConvention);
    fixture.componentRef.setInput('convention', convention);
    emis = [];
    fixture.componentInstance.modifiee.subscribe((e) => emis.push(e));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  const saisir = (racine: HTMLElement, selecteur: string, valeur: string) => {
    const champ = racine.querySelector(selecteur) as HTMLInputElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
  };

  afterEach(() => http.verify());

  it('propose les décisions selon le statut', () => {
    const racine = afficher(uneConvention());
    expect(bouton(racine, 'Prendre en examen')).toBeTruthy();
    expect(bouton(racine, 'Refuser…')).toBeTruthy();
    expect(bouton(racine, 'Enregistrer la signature…')).toBeUndefined();
    bouton(racine, 'Prendre en examen').click();
    http.expectOne('/api/admin/partenariats/conventions/c1/examiner').flush(uneConvention({ statut: 'EN_EXAMEN' }));
    expect(emis[0].convention.statut).toBe('EN_EXAMEN');
  });

  it('exige des dates cohérentes avant d’activer', () => {
    const racine = afficher(uneConvention({ statut: 'EN_NEGOCIATION' }));
    bouton(racine, 'Enregistrer la signature…').click();
    fixture.detectChanges();
    bouton(racine, 'Activer la convention').click();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Indiquez les dates');

    saisir(racine, '#action-signature', '2026-01-10');
    saisir(racine, '#action-debut', '2026-01-10');
    saisir(racine, '#action-fin', '2030-01-09');
    bouton(racine, 'Activer la convention').click();
    const requete = http.expectOne('/api/admin/partenariats/conventions/c1/activer');
    expect(requete.request.body).toEqual({ dateSignature: '2026-01-10', dateDebut: '2026-01-10', dateFin: '2030-01-09' });
    requete.flush(uneConvention({ statut: 'ACTIVE' }));
    expect(emis[0].message).toContain('partenaire de l’EPT');
  });

  it('n’affiche rien pour une convention close ; la résiliation a son propre bloc', () => {
    const racine = afficher(uneConvention({ statut: 'ACTIVE', dateSignature: '2026-01-10', dateDebut: '2026-01-10', dateFin: '2030-01-09' }));
    expect(bouton(racine, 'Résilier…')).toBeUndefined();
    fixture.componentRef.setInput('convention', uneConvention({ statut: 'RESILIEE' }));
    fixture.detectChanges();
    expect(racine.querySelector('section')).toBeNull();
  });
});
