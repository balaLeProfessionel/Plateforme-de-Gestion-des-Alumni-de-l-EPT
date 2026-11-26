import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Convention } from '../../../core/services/models/partenariat.model';
import { uneConvention } from '../testing/donnees-partenariat';
import { ResiliationConvention } from './resiliation-convention';

describe('ResiliationConvention', () => {
  let fixture: ComponentFixture<ResiliationConvention>;
  let http: HttpTestingController;
  let emis: { convention: Convention; message: string }[];

  const afficher = (convention: Convention, admin = false) => {
    TestBed.configureTestingModule({ imports: [ResiliationConvention], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ResiliationConvention);
    fixture.componentRef.setInput('convention', convention);
    fixture.componentRef.setInput('admin', admin);
    emis = [];
    fixture.componentInstance.modifiee.subscribe((e) => emis.push(e));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement | undefined;

  afterEach(() => http.verify());

  it('laisse l’organisme signaler une résiliation motivée, avec préavis', () => {
    const racine = afficher(uneConvention({ statut: 'ACTIVE', resiliable: true }));
    bouton(racine, 'Résilier…')?.click();
    fixture.detectChanges();
    expect(racine.textContent).toContain('3 mois après ce signalement');
    bouton(racine, 'Signaler la résiliation')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Le motif est obligatoire');
    const motif = racine.querySelector('textarea') as HTMLTextAreaElement;
    motif.value = 'Changement de stratégie';
    motif.dispatchEvent(new Event('input'));
    bouton(racine, 'Signaler la résiliation')?.click();
    const requete = http.expectOne('/api/partenariats/conventions/c1/resilier');
    expect(requete.request.body).toEqual({ motif: 'Changement de stratégie' });
    requete.flush(uneConvention({ statut: 'ACTIVE', dateEffetResiliation: '2027-02-23', resiliationAnnulable: true }));
    expect(emis[0].message).toContain('préavis de 3 mois');
  });

  it('propose d’annuler à la partie qui a signalé la résiliation, et rien à l’autre', () => {
    const racine = afficher(uneConvention({
      statut: 'ACTIVE', resiliationDemandeePar: 'ECOLE', resiliationDemandeeLe: '2026-11-23', dateEffetResiliation: '2027-02-23', resiliationAnnulable: true,
    }), true);
    expect(racine.textContent).toContain('2027');
    expect(racine.textContent).toContain('vous pouvez y renoncer');
    bouton(racine, 'Annuler la résiliation')?.click();
    http.expectOne('/api/admin/partenariats/conventions/c1/annuler-resiliation').flush(uneConvention({ statut: 'ACTIVE', resiliable: true }));
    expect(emis[0].message).toContain('la convention continue');

    fixture.componentRef.setInput('convention', uneConvention({ statut: 'ACTIVE', dateEffetResiliation: '2027-02-23' }));
    fixture.detectChanges();
    expect(racine.querySelector('section')).toBeNull();
  });
});
