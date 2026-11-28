import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { BrouillonCv } from '../../../../core/services/import-cv/brouillon-cv';
import { Profil } from '../../../../core/services/models/profil.model';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { EtapeInfos } from './etape-infos';

const PROFIL: Profil = {
  id: 'u1', nom: 'Manuelle', prenom: 'Awa', email: 'awa@example.test', role: 'ALUMNI', statutCompte: 'ACTIF',
  bio: null, villeResidence: null, posteActuel: null, lienLinkedin: null, lienPortfolio: null, urlPhoto: null,
  telephone: null, dateNaissance: null, filiere: null, classe: null, anneeSortie: 2021, recherchePublique: true,
  situationActuelle: null, paysResidence: null
};

describe('EtapeInfos', () => {
  async function creer() {
    const service = {
      obtenirProfil: vi.fn().mockReturnValue(of(PROFIL)),
      majProfil: vi.fn((donnees: Partial<Profil>) => of({ ...PROFIL, ...donnees }))
    };
    const courant = signal(null);
    TestBed.configureTestingModule({
      imports: [EtapeInfos],
      providers: [
        provideRouter([]),
        { provide: ProfilService, useValue: service },
        { provide: BrouillonCv, useValue: { profil: computed(() => courant()), charger: vi.fn().mockReturnValue(of(null)) } }
      ]
    });
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(EtapeInfos);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const principal = () => element.querySelector<HTMLButtonElement>('app-navigation-etapes button')!;
    return { fixture, element, service, navigation, principal };
  }

  it('n affiche le formulaire qu une fois le profil reçu, pour ne pas effacer une saisie', () => {
    const profil$ = new Subject<Profil>();
    TestBed.configureTestingModule({
      imports: [EtapeInfos],
      providers: [
        provideRouter([]),
        { provide: ProfilService, useValue: { obtenirProfil: () => profil$, majProfil: vi.fn() } },
        { provide: BrouillonCv, useValue: { profil: signal(null), charger: () => of(null) } }
      ]
    });
    const fixture = TestBed.createComponent(EtapeInfos);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#villeResidence')).toBeNull();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Chargement');

    profil$.next(PROFIL);
    profil$.complete();
    fixture.detectChanges();
    expect(element.querySelector('#villeResidence')).not.toBeNull();
  });

  it('sans modification, « Continuer » passe à l étape suivante sans enregistrer', async () => {
    const { service, navigation, principal } = await creer();
    expect(principal().textContent).toContain('Continuer');
    principal().click();
    expect(service.majProfil).not.toHaveBeenCalled();
    expect(navigation).toHaveBeenCalledWith(['/completer-profil/formations']);
  });

  it('après une saisie, le bouton enregistre puis continue', async () => {
    const { fixture, element, service, navigation, principal } = await creer();
    const ville = element.querySelector<HTMLInputElement>('#villeResidence')!;
    ville.value = 'Thiès';
    ville.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(principal().textContent).toContain('Enregistrer et continuer');
    principal().click();
    await fixture.whenStable();
    expect(service.majProfil).toHaveBeenCalledWith(expect.objectContaining({ villeResidence: 'Thiès' }));
    expect(navigation).toHaveBeenCalledWith(['/completer-profil/formations']);
  });
});
