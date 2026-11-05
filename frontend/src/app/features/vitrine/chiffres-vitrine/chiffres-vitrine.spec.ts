import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ChiffresVitrine } from './chiffres-vitrine';

describe('ChiffresVitrine', () => {
  it('genere les quatre blocs a partir des donnees', async () => {
    registerLocaleData(localeFr);
    await TestBed.configureTestingModule({
      imports: [ChiffresVitrine],
      providers: [{ provide: LOCALE_ID, useValue: 'fr' }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ChiffresVitrine);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const blocs = Array.from(element.querySelectorAll('.chiffres li')).map((bloc) => ({
      icone: bloc.querySelector('i')?.className,
      valeur: bloc.querySelector('.valeur')?.textContent?.replace(/\s/g, ' ').trim(),
      libelle: bloc.querySelector('.libelle')?.textContent?.trim(),
    }));
    expect(blocs).toEqual([
      { icone: 'pi pi-flag', valeur: '43', libelle: 'Nationalités' },
      { icone: 'pi pi-graduation-cap', valeur: '3 727', libelle: 'Alumni' },
      { icone: 'pi pi-users', valeur: 'À venir', libelle: 'Offres d’emploi' },
      { icone: 'pi pi-thumbs-up', valeur: '200', libelle: 'Fans' },
    ]);
    expect(element.querySelector('h2')?.textContent).toContain('L’EPT en chiffres');
  });
});
