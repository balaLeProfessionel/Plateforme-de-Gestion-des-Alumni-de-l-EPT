import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OffreEmploi } from '../../../core/services/models/offre-emploi.model';
import { uneOffreEmploi, uneOffreGeree } from '../testing/donnees-offres-emploi';
import { CarteOffreEmploi } from './carte-offre-emploi';

describe('CarteOffreEmploi', () => {
  const afficher = (offre: OffreEmploi) => {
    TestBed.configureTestingModule({ imports: [CarteOffreEmploi], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CarteOffreEmploi);
    fixture.componentRef.setInput('offre', offre);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const pastilles = (racine: HTMLElement) => [...racine.querySelectorAll('.pastille')].map((p) => p.textContent?.trim());

  it('annonce la candidature sur la plateforme pour une offre gérée ouverte', () => {
    const racine = afficher(uneOffreGeree());
    expect(pastilles(racine)).toContain('Candidature sur la plateforme');
    expect(racine.querySelector('.carte')?.classList).not.toContain('fermee');
  });

  it('signale une offre gérée clôturée au lieu de promettre la candidature', () => {
    const racine = afficher(uneOffreGeree({ cloturee: true }));
    expect(pastilles(racine)).toContain('Recrutement clôturé');
    expect(pastilles(racine)).not.toContain('Candidature sur la plateforme');
    expect(racine.querySelector('.carte')?.classList).toContain('fermee');
  });

  it('marque une offre relayée expirée', () => {
    const racine = afficher(uneOffreEmploi({ expiree: true }));
    expect(pastilles(racine)).toEqual(expect.arrayContaining(['Offre relayée', 'Expirée']));
    expect(racine.querySelector('.infos')?.textContent).toContain('Expirée le');
    expect(racine.querySelector('.carte')?.classList).toContain('fermee');
  });
});
