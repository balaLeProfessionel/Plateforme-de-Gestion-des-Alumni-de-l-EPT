import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Accord } from '../../../core/services/models/partenariat.model';
import { unAccord } from '../testing/donnees-partenariat';
import { DecisionAccord } from './decision-accord';

describe('DecisionAccord', () => {
  let fixture: ComponentFixture<DecisionAccord>;
  let http: HttpTestingController;
  let emis: { accord: Accord; message: string }[];

  const afficher = (accord: Accord, admin = false) => {
    TestBed.configureTestingModule({ imports: [DecisionAccord], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DecisionAccord);
    fixture.componentRef.setInput('accord', accord);
    fixture.componentRef.setInput('admin', admin);
    emis = [];
    fixture.componentInstance.modifie.subscribe((e) => emis.push(e));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement | undefined;

  afterEach(() => http.verify());

  it('laisse l’organisme accepter la proposition de l’école', () => {
    const racine = afficher(unAccord());
    expect(racine.textContent).toContain('Votre réponse est attendue');
    expect(bouton(racine, 'Retirer la proposition…')).toBeUndefined();
    bouton(racine, 'Accepter l’accord')?.click();
    http.expectOne('/api/partenariats/accords/a1/accepter').flush(unAccord({ statut: 'A_VENIR', aRepondre: false }));
    expect(emis[0].accord.statut).toBe('A_VENIR');
  });

  it('exige un motif pour refuser', () => {
    const racine = afficher(unAccord(), true);
    bouton(racine, 'Refuser…')?.click();
    fixture.detectChanges();
    bouton(racine, 'Refuser l’accord')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Le motif est obligatoire');
    const motif = racine.querySelector('textarea') as HTMLTextAreaElement;
    motif.value = 'Pas de places';
    motif.dispatchEvent(new Event('input'));
    bouton(racine, 'Refuser l’accord')?.click();
    const requete = http.expectOne('/api/admin/partenariats/accords/a1/refuser');
    expect(requete.request.body).toEqual({ motif: 'Pas de places' });
    requete.flush(unAccord({ statut: 'REFUSE', aRepondre: false }));
  });

  it('propose au proposant de corriger ou de retirer sa proposition', () => {
    const racine = afficher(unAccord({ aRepondre: false, modifiable: true, proposePar: 'ORGANISME' }));
    expect(bouton(racine, 'Accepter l’accord')).toBeUndefined();
    bouton(racine, 'Retirer la proposition…')?.click();
    fixture.detectChanges();
    bouton(racine, 'Retirer la proposition')?.click();
    http.expectOne('/api/partenariats/accords/a1/retirer').flush(unAccord({ statut: 'RETIRE', aRepondre: false }));
    expect(emis[0].accord.statut).toBe('RETIRE');
  });

  it('laisse l’organisme signaler une résiliation avec préavis, motif obligatoire', () => {
    const racine = afficher(unAccord({ statut: 'ACTIF', aRepondre: false, resiliable: true }));
    bouton(racine, 'Résilier…')?.click();
    fixture.detectChanges();
    expect(racine.textContent).toContain('3 mois après ce signalement');
    bouton(racine, 'Signaler la résiliation')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Le motif est obligatoire');
    const motif = racine.querySelector('textarea') as HTMLTextAreaElement;
    motif.value = 'Réorganisation';
    motif.dispatchEvent(new Event('input'));
    bouton(racine, 'Signaler la résiliation')?.click();
    http.expectOne('/api/partenariats/accords/a1/resilier')
      .flush(unAccord({ statut: 'ACTIF', aRepondre: false, resiliable: false, dateEffetResiliation: '2027-02-23' }));
    expect(emis[0].message).toContain('préavis de 3 mois');

    fixture.componentRef.setInput('accord', emis[0].accord);
    fixture.detectChanges();
    expect(racine.querySelector('section')).toBeNull();
  });
});
